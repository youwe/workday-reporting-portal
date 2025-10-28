import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { generateReportCSV } from "./utils/csvGenerator";
import { ReportType } from "@shared/reportTypes";
import { storagePut } from "./storage";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  organizations: router({
    list: publicProcedure.query(async () => {
      return db.getAllOrganizations();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOrganizationById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["services", "saas"]),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create organizations" });
        }
        return db.createOrganization(input);
      }),
  }),

  uploads: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view uploads" });
      }
      return db.getAllDataUploads();
    }),
    byOrganization: publicProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input }) => {
        return db.getDataUploadsByOrganization(input.organizationId);
      }),
    create: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        fileName: z.string(),
        fileType: z.enum(["csv", "excel"]),
        fileUrl: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can upload data" });
        }
        return db.createDataUpload({
          ...input,
          uploadedBy: ctx.user.id,
        });
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "processing", "completed", "failed"]),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update upload status" });
        }
        return db.updateDataUploadStatus(input.id, input.status, input.errorMessage);
      }),
  }),

  reports: router({
    list: publicProcedure.query(async () => {
      return db.getAllReports();
    }),
    byOrganization: publicProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ input }) => {
        return db.getReportsByOrganization(input.organizationId);
      }),
    create: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        reportType: z.string(),
        period: z.string(),
        fileUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createReport({
          ...input,
          generatedBy: ctx.user.id,
        });
      }),
    generate: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        reportType: z.string(),
        period: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can generate reports" });
        }

        // Get financial data for the period
        const financialData = await db.getFinancialDataByOrganizationAndPeriod(
          input.organizationId,
          input.period
        );

        if (financialData.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No financial data found for this period",
          });
        }

        // Generate CSV
        const csvContent = generateReportCSV(
          input.reportType as ReportType,
          financialData,
          input.period
        );

        // Upload to S3
        const fileName = `${input.organizationId}-${input.reportType}-${input.period}.csv`;
        const { url } = await storagePut(
          `reports/${fileName}`,
          Buffer.from(csvContent, "utf-8"),
          "text/csv"
        );

        // Create report record
        await db.createReport({
          organizationId: input.organizationId,
          reportType: input.reportType,
          period: input.period,
          fileUrl: url,
          generatedBy: ctx.user.id,
          status: "generated",
        });

        return { success: true, fileUrl: url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
