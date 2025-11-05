import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { parseCSV, parseCSVFile, mapCSVRow, validateRequiredFields } from "./utils/csvParser";
import { CSV_MAPPINGS, findColumn, parseDate } from "../shared/csvMappings";
import { calculateServicesKPIs, calculateSaaSKPIs } from "./utils/kpiCalculations";
import { TRPCError } from "@trpc/server";
import { chatWithAssistant, generateSuggestedQuestions, generateExecutiveSummary } from "./utils/aiAssistant";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Organizations
  organizations: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllOrganizations();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrganizationById(input.id);
      }),

    getHierarchy: protectedProcedure.query(async () => {
      const allOrgs = await db.getAllOrganizations();
      
      // Build tree structure
      const buildTree = (parentId: number | null): any[] => {
        return allOrgs
          .filter(org => org.parentId === parentId)
          .map(org => ({
            ...org,
            children: buildTree(org.id),
          }));
      };

      return buildTree(null);
    }),
  }),

  // Upload Types
  uploadTypes: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllUploadTypes();
    }),
  }),

  // Data Uploads
  uploads: router({
    // Simplified upload endpoint for direct CSV processing
    create: protectedProcedure
      .input(z.object({
        uploadType: z.string(),
        filename: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        try {
          // Parse CSV content
          const rows = parseCSV(input.content);
          if (rows.length === 0) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: 'No data found in CSV file' 
            });
          }

          // Detect entities and periods from data
          const entities = new Set<string>();
          const periods = new Set<string>();
          
          // Get entity column from mapping
          const mapping = CSV_MAPPINGS[input.uploadType];
          if (!mapping) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: `Unknown upload type: ${input.uploadType}` 
            });
          }

          const entityCol = findColumn(Object.keys(rows[0]), [mapping.entityColumn]);
          const dateCol = findColumn(Object.keys(rows[0]), [mapping.dateColumn]);

          rows.forEach(row => {
            if (entityCol && row[entityCol]) {
              entities.add(row[entityCol]);
            }
            if (dateCol && row[dateCol]) {
              const date = parseDate(row[dateCol]);
              if (date) {
                const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                periods.add(period);
              }
            }
          });

          // Get upload type ID
          const uploadTypeRecord = await db.getUploadTypeByCode(input.uploadType);
          if (!uploadTypeRecord) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: `Upload type not found: ${input.uploadType}` 
            });
          }

          // Create upload record
          const primaryPeriod = Array.from(periods)[0] || new Date().toISOString().slice(0, 7);
          const uploadId = await db.createDataUpload({
            organizationId: null, // Multi-entity upload
            uploadTypeId: uploadTypeRecord.id,
            uploadedBy: ctx.user.id,
            period: primaryPeriod,
            fileName: input.filename,
            fileType: 'csv',
            fileUrl: '', // In-memory upload, no file URL
            status: 'processing',
          });

          // Map and store data based on upload type
          const mappedRows = rows.map(row => mapCSVRow(row, input.uploadType));
          
          try {
            switch (input.uploadType) {
              case 'journal_lines':
                await db.insertJournalLines(mappedRows.map(row => ({
                  ...row,
                  uploadId,
                })));
                break;
              
              case 'customer_invoices':
                await db.insertCustomerInvoices(mappedRows.map(row => ({
                  ...row,
                  uploadId,
                })));
                break;

              case 'supplier_invoices':
                await db.insertSupplierInvoices(mappedRows.map(row => ({
                  ...row,
                  uploadId,
                })));
                break;

              case 'customer_contracts':
                await db.insertCustomerContracts(mappedRows.map(row => ({
                  ...row,
                  uploadId,
                })));
                break;

              case 'time_entries':
                await db.insertTimeEntries(mappedRows.map(row => ({
                  ...row,
                  uploadId,
                })));
                break;

              default:
                console.warn(`No handler for upload type: ${input.uploadType}`);
            }

            // Update upload status to completed
            await db.updateDataUploadStatus(uploadId, 'completed', rows.length);

          } catch (dbError: any) {
            await db.updateDataUploadStatus(uploadId, 'failed', 0, dbError.message);
            throw dbError;
          }
          
          return {
            success: true,
            uploadId,
            recordsProcessed: rows.length,
            entitiesFound: Array.from(entities),
            periodsFound: Array.from(periods),
          };
        } catch (error: any) {
          console.error('Upload error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Failed to process upload',
          });
        }
      }),

    // Legacy upload endpoint
    createLegacy: protectedProcedure
      .input(z.object({
        organizationId: z.number().optional(),
        uploadTypeId: z.number(),
        period: z.string(),
        fileName: z.string(),
        fileType: z.enum(['csv', 'excel']),
        fileUrl: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const uploadId = await db.createDataUpload({
          ...input,
          uploadedBy: ctx.user.id,
          status: 'pending',
        });

        return { uploadId, success: true };
      }),

    list: protectedProcedure
      .input(z.object({ period: z.string().optional() }))
      .query(async ({ input }) => {
        if (!input.period) return [];
        return await db.getDataUploadsByPeriod(input.period);
      }),

    process: protectedProcedure
      .input(z.object({
        uploadId: z.number(),
        filePath: z.string(),
        uploadTypeCode: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          await db.updateDataUploadStatus(input.uploadId, 'processing');

          // Parse CSV
          const parsed = await parseCSVFile(input.filePath);

          // Map and validate rows
          const mappedRows = parsed.rows.map(row => mapCSVRow(row, input.uploadTypeCode));
          
          // Insert into appropriate table based on upload type
          switch (input.uploadTypeCode) {
            case 'journal_lines':
              await db.insertJournalLines(mappedRows.map(row => ({
                ...row,
                uploadId: input.uploadId,
              })));
              break;
            
            case 'customer_invoices':
              await db.insertCustomerInvoices(mappedRows.map(row => ({
                ...row,
                uploadId: input.uploadId,
              })));
              break;

            case 'supplier_invoices':
              await db.insertSupplierInvoices(mappedRows.map(row => ({
                ...row,
                uploadId: input.uploadId,
              })));
              break;

            case 'customer_contracts':
              await db.insertCustomerContracts(mappedRows.map(row => ({
                ...row,
                uploadId: input.uploadId,
              })));
              break;

            case 'time_entries':
              await db.insertTimeEntries(mappedRows.map(row => ({
                ...row,
                uploadId: input.uploadId,
              })));
              break;
          }

          await db.updateDataUploadStatus(input.uploadId, 'completed', parsed.rowCount);

          return { success: true, recordCount: parsed.rowCount };
        } catch (error: any) {
          await db.updateDataUploadStatus(input.uploadId, 'failed', 0, error.message);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: `Upload processing failed: ${error.message}` 
          });
        }
      }),
  }),

  // KPIs
  kpis: router({
    calculate: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        period: z.string(),
      }))
      .mutation(async ({ input }) => {
        const org = await db.getOrganizationById(input.organizationId);
        if (!org) throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' });

        // Get data for period
        const journalLines = await db.getJournalLinesByPeriod(input.period);
        const timeEntries: any[] = []; // Would fetch from DB
        const customerInvoices: any[] = []; // Would fetch from DB
        const supplierInvoices: any[] = []; // Would fetch from DB
        const customerContracts: any[] = []; // Would fetch from DB

        // Calculate KPIs based on organization type
        let kpis;
        if (org.type === 'saas') {
          kpis = calculateSaaSKPIs(journalLines, customerContracts, customerInvoices, input.period);
        } else {
          kpis = calculateServicesKPIs(
            journalLines,
            timeEntries,
            customerInvoices,
            supplierInvoices,
            input.period
          );
        }

        // Store KPIs in database
        await db.insertKpiData(kpis.map(kpi => ({
          organizationId: input.organizationId,
          period: input.period,
          ...kpi,
        })));

        return { success: true, kpis };
      }),

    get: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        period: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getKpisByOrganizationAndPeriod(input.organizationId, input.period);
      }),
  }),

  // Reports
  reports: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getReportsByOrganization(input.organizationId);
      }),

    generate: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        reportType: z.string(),
        period: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        // Generate report logic would go here
        // For now, return placeholder

        return {
          success: true,
          reportId: 1,
          message: 'Report generation queued',
        };
      }),
  }),

  // AI Assistant
  ai: router({    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })),
        organizationId: z.number(),
        period: z.string(),
      }))
      .mutation(async ({ input }) => {
        const organizations = await db.getAllOrganizations();
        const kpis = await db.getKpisByOrganizationAndPeriod(input.organizationId, input.period);
        const journalLines = await db.getJournalLinesByPeriod(input.period);

        const response = await chatWithAssistant(input.messages, {
          organizations,
          kpis,
          journalLines,
          period: input.period,
        });

        return { response };
      }),

    suggestedQuestions: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        period: z.string(),
      }))
      .query(async ({ input }) => {
        const organizations = await db.getAllOrganizations();
        const kpis = await db.getKpisByOrganizationAndPeriod(input.organizationId, input.period);

        const questions = generateSuggestedQuestions({
          organizations,
          kpis,
          journalLines: [],
          period: input.period,
        });

        return { questions };
      }),

    executiveSummary: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        period: z.string(),
      }))
      .mutation(async ({ input }) => {
        const organizations = await db.getAllOrganizations();
        const kpis = await db.getKpisByOrganizationAndPeriod(input.organizationId, input.period);
        const journalLines = await db.getJournalLinesByPeriod(input.period);

        const summary = await generateExecutiveSummary({
          organizations,
          kpis,
          journalLines,
          period: input.period,
        });

        return { summary };
      }),
  }),

  // Intercompany Transactions
  intercompany: router({
    detect: protectedProcedure
      .input(z.object({ period: z.string() }))
      .mutation(async ({ input }) => {
        const journalLines = await db.getJournalLinesByPeriod(input.period);
        
        // Detect intercompany transactions
        const intercompanyTxns = journalLines.filter(line => 
          line.intercompanyMatchId && line.intercompanyMatchId !== ''
        );

        // Group by match ID
        const grouped = intercompanyTxns.reduce((acc, line) => {
          const matchId = line.intercompanyMatchId || '';
          if (!acc[matchId]) acc[matchId] = [];
          acc[matchId].push(line);
          return acc;
        }, {} as Record<string, typeof journalLines>);

        // Create intercompany transaction records
        const transactions = Object.entries(grouped).map(([matchId, lines]) => {
          const debitLine = lines.find(l => parseFloat(l.debitAmount || '0') > 0);
          const creditLine = lines.find(l => parseFloat(l.creditAmount || '0') > 0);

          if (!debitLine || !creditLine) return null;

          return {
            period: input.period,
            fromCompany: creditLine.company,
            toCompany: debitLine.company,
            amount: creditLine.creditAmount || '0',
            currency: creditLine.currency || 'EUR',
            matchId,
            eliminated: false,
            eliminationLevel: null,
            sourceJournalLineId: creditLine.id,
          };
        }).filter(Boolean);

        if (transactions.length > 0) {
          await db.insertIntercompanyTransactions(transactions as any);
        }

        return {
          success: true,
          transactionsDetected: transactions.length,
        };
      }),

    list: protectedProcedure
      .input(z.object({ period: z.string() }))
      .query(async ({ input }) => {
        return await db.getIntercompanyTransactionsByPeriod(input.period);
      }),
  }),
});

export type AppRouter = typeof appRouter;
