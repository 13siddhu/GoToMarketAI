import { NextRequest } from 'next/server';
import { generateQueries } from '@/services/queryGenerator';
import { searchGoogle } from '@/services/serpApiService';
import { validateAndExtractWebsites } from '@/services/discoverScraper';
import { crawlCompany } from '@/services/crawler';
import { detectTechStack } from '@/services/techDetector';
import { analyzeCompany } from '@/services/aiAnalyzer';
import { enrichDecisionMakers } from '@/services/decisionMaker';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { niche, country } = await req.json();

    if (!niche || !country) {
      return new Response("Invalid request, expected niche and country", { status: 400 });
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // PHASE 1: Discovery
          sendEvent('log', { message: `Generating queries for ${niche} in ${country}...` });
          sendEvent('progress', { percent: 5, message: 'Generating Search Queries...' });
          const queries = await generateQueries(niche, country);
          
          sendEvent('log', { message: `Searching Google with ${queries.length} queries...` });
          sendEvent('progress', { percent: 15, message: 'Searching Google...' });
          const urls = await searchGoogle(queries);
          
          sendEvent('log', { message: `Found ${urls.length} raw URLs. Validating domains...` });
          sendEvent('progress', { percent: 25, message: 'Validating Websites...' });
          const rawLeads = await validateAndExtractWebsites(urls);
          
          sendEvent('log', { message: `Validated ${rawLeads.length} D2C domains!` });
          
          // LIMIT FOR TESTING: Only process a maximum of 5 leads
          const leadsToProcess = rawLeads.slice(0, 5);
          sendEvent('raw_leads_found', { count: leadsToProcess.length });

          // PHASE 2: Enrichment
          const totalLeads = leadsToProcess.length;
          
          for (let i = 0; i < totalLeads; i++) {
            const { companyName, website } = leadsToProcess[i];
            const baseProgress = 25 + ((i / totalLeads) * 75);
            
            sendEvent('log', { message: `Crawling ${companyName} (${website})...` });
            sendEvent('progress', { percent: baseProgress, message: `Crawling ${companyName}...` });
            const text = await crawlCompany(website);
            
            sendEvent('log', { message: `Detecting Tech Stack for ${companyName}...` });
            sendEvent('progress', { percent: baseProgress + 1, message: `Detecting Tech Stack...` });
            const techStack = await detectTechStack(website);
            
            sendEvent('log', { message: `AI analyzing ${companyName}...` });
            sendEvent('progress', { percent: baseProgress + 2, message: `AI Analysis running...` });
            const aiData = await analyzeCompany(companyName, website, text, techStack);
            
            sendEvent('log', { message: `Finding Decision Makers for ${companyName}...` });
            sendEvent('progress', { percent: baseProgress + 3, message: `Enriching Contacts...` });
            const finalContacts = await enrichDecisionMakers(companyName, aiData.contacts);
            
            const finalLead = {
              companyName,
              website,
              ...aiData,
              contacts: finalContacts
            };

            sendEvent('log', { message: `Successfully enriched ${companyName}! Total Score: ${finalLead.totalScore}/100` });
            sendEvent('lead_complete', { lead: finalLead, index: i });
          }

          sendEvent('progress', { percent: 100, message: 'Complete!' });
          sendEvent('log', { message: 'Pipeline finished successfully.' });
          sendEvent('done', { message: 'All leads processed' });
        } catch (error: any) {
          console.error("Pipeline error:", error);
          sendEvent('error', { message: error.message || 'Internal server error' });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response("Internal error", { status: 500 });
  }
}
