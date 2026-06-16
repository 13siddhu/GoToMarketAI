import { chromium } from 'playwright';

export interface Lead {
  companyName: string;
  website: string;
  title: string;
  description: string;
  sourceQuery: string;
}

const isInvalidDomain = (url: string): boolean => {
  const invalidKeywords = ['amazon', 'flipkart', 'myntra', 'nykaa', 'wikipedia', 'news', 'blog', 'facebook', 'instagram', 'twitter', 'linkedin', 'pinterest', 'youtube'];
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return invalidKeywords.some(keyword => hostname.includes(keyword));
  } catch {
    return true; // invalid URL
  }
};

export const validateAndExtractWebsites = async (urls: string[]): Promise<Lead[]> => {
  const validLeads: Lead[] = [];
  
  // Launch Playwright browser
  const browser = await chromium.launch({ headless: true });
  
  for (const url of urls) {
    if (isInvalidDomain(url)) continue;

    const page = await browser.newPage();
    try {
      // Set a short timeout to not get stuck on slow websites
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      const title = await page.title();
      const description = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="description"]');
        return meta ? meta.getAttribute('content') : '';
      });
      const ogSiteName = await page.evaluate(() => {
        const meta = document.querySelector('meta[property="og:site_name"]');
        return meta ? meta.getAttribute('content') : '';
      });

      // Try to determine company name
      let companyName = ogSiteName || title.split('-')[0].split('|')[0].trim();
      
      if (companyName && companyName.length > 0) {
        validLeads.push({
          companyName,
          website: url,
          title: title || '',
          description: description || '',
          sourceQuery: 'Generated via query expansion' // Ideally map back to original query
        });
      }
    } catch (error) {
      console.log(`Failed to process ${url}:`, (error as Error).message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  return validLeads;
};
