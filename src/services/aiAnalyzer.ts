import OpenAI from 'openai';
import { CompanyIntelligenceSchema, CompanyIntelligence } from '../lib/schema';
import { zodResponseFormat } from 'openai/helpers/zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const analyzeCompany = async (
  companyName: string, 
  website: string, 
  text: string, 
  techStack: string[]
): Promise<CompanyIntelligence> => {
  const prompt = `
You are an expert Lead Intelligence Analyst for an AI SDR platform.
Analyze the provided web scraped content and tech stack for the company "${companyName}" (${website}).

Extract and infer all required data accurately to match the schema.
- Pay attention to the rubric for scoring (Revenue Potential, Marketing Maturity, AI Opportunity, Strategic Fit) and output an integer 0-25 for each.
- Tech Stack detected by Wappalyzer: ${techStack.join(', ') || 'None detected'}. Combine this with your analysis to identify CRM, Agencies, and Marketing Channels.
- Discover all key decision makers from the text (Founder, CEO, Marketing Lead). If missing, look for ANY employee. Do NOT fabricate contacts. If completely missing, return an empty array for contacts.
- EXTRACT CONTACT INFO: Look deeply for any publicEmail, publicPhoneNumber, or linkedInUrl for each decision maker. Also extract the general company contactEmail and contactPhone.
- Do NOT fabricate Revenue or Employee counts. Estimate them based on the quality of the site, team size, presence of careers pages, etc.

Scraped Content:
${text}
`;

  try {
    const completion = await openai.chat.completions.parse({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a precise Lead Intelligence AI. Always respond via the structured schema." },
        { role: "user", content: prompt }
      ],
      response_format: zodResponseFormat(CompanyIntelligenceSchema, "intelligence_report")
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) {
      throw new Error("Failed to parse company intelligence");
    }
    return parsed;
  } catch (error: any) {
    if (error?.status === 429) {
      console.warn("OpenAI Quota Exceeded. Returning mock intelligence data to keep pipeline running...");
      return {
        companyDescription: "This is a mock description because your OpenAI API key is completely out of credits. Please add $5 to your OpenAI billing dashboard.",
        businessModel: "B2C",
        industry: "E-Commerce",
        revenueEstimate: "$1M - $5M",
        employeeCount: "10-50",
        companySize: "SMB",
        marketingChannels: ["Instagram", "Google Ads"],
        techStack: techStack.length > 0 ? techStack : ["Shopify"],
        revenuePotential: 20,
        marketingMaturity: 15,
        aiOpportunity: 20,
        strategicFit: 25,
        totalScore: 80,
        triggers: ["Scaling e-commerce", "Needs automation"],
        contacts: [
          {
            contactName: "John Doe (Mock)",
            designation: "Founder",
            contactType: "Founder",
            confidenceScore: 90
          }
        ]
      };
    }
    throw error;
  }
};
