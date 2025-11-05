import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FinancialContext {
  organizations: any[];
  kpis: any[];
  journalLines: any[];
  period: string;
}

/**
 * Generate system prompt with financial context
 */
function generateSystemPrompt(context: FinancialContext): string {
  return `You are a financial intelligence assistant for a multi-entity corporate group. You have access to financial data from Workday and can help analyze KPIs, generate insights, and answer questions about the financial performance.

**Available Organizations:**
${context.organizations.map(org => `- ${org.name} (${org.type}, ${org.reportingType})`).join('\n')}

**Current Period:** ${context.period}

**Available KPIs:**
${context.kpis.map(kpi => `- ${kpi.kpiType}: ${kpi.value} ${kpi.unit}`).join('\n')}

**Capabilities:**
- Analyze financial performance across entities
- Explain KPI trends and variances
- Provide consolidation insights
- Identify anomalies or areas of concern
- Generate actionable recommendations
- Answer questions about specific metrics

**Guidelines:**
- Be concise and data-driven
- Highlight key insights and trends
- Use percentages and comparisons when relevant
- Suggest areas for deeper analysis
- Format numbers clearly (e.g., €45,000 or 12.5%)
- When discussing consolidation, mention intercompany eliminations and minority interests`;
}

/**
 * Chat with AI assistant about financial data
 */
export async function chatWithAssistant(
  messages: ChatMessage[],
  context: FinancialContext
): Promise<string> {
  try {
    const systemPrompt = generateSystemPrompt(context);

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.type === 'text' ? textContent.text : 'No response generated';
  } catch (error: any) {
    console.error('[AI Assistant] Error:', error);
    throw new Error(`AI Assistant error: ${error.message}`);
  }
}

/**
 * Generate suggested questions based on available data
 */
export function generateSuggestedQuestions(context: FinancialContext): string[] {
  const questions: string[] = [
    `What is the overall financial performance for ${context.period}?`,
    "Which organization has the highest gross margin?",
    "Show me the EBITDA trend across all entities",
  ];

  // Add organization-specific questions
  const servicesOrgs = context.organizations.filter(o => o.type === 'services');
  const saasOrgs = context.organizations.filter(o => o.type === 'saas');

  if (servicesOrgs.length > 0) {
    questions.push("What is the billable utilization rate for professional services?");
    questions.push("How does revenue per FTE compare across service entities?");
  }

  if (saasOrgs.length > 0) {
    questions.push("What is the MRR growth rate for SaaS entities?");
    questions.push("How is customer churn trending?");
  }

  // Add consolidation questions
  if (context.organizations.length > 1) {
    questions.push("What is the impact of intercompany eliminations on consolidated revenue?");
    questions.push("How much minority interest affects the bottom line?");
  }

  return questions;
}

/**
 * Analyze KPI and generate insights
 */
export async function analyzeKPI(
  kpiType: string,
  value: number,
  context: FinancialContext
): Promise<string> {
  const prompt = `Analyze this KPI and provide insights:

**KPI:** ${kpiType}
**Value:** ${value}
**Period:** ${context.period}

Provide:
1. Brief interpretation of the metric
2. Whether this is good/concerning and why
3. One actionable recommendation`;

  const response = await chatWithAssistant(
    [{ role: 'user', content: prompt }],
    context
  );

  return response;
}

/**
 * Generate executive summary
 */
export async function generateExecutiveSummary(
  context: FinancialContext
): Promise<string> {
  const prompt = `Generate a concise executive summary of the financial performance for ${context.period}. Include:

1. Overall performance highlights
2. Key metrics and trends
3. Areas of concern or opportunity
4. Top 3 recommendations

Keep it under 200 words and use bullet points.`;

  const response = await chatWithAssistant(
    [{ role: 'user', content: prompt }],
    context
  );

  return response;
}
