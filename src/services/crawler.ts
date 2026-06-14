import { chromium } from 'playwright';
import * as cheerio from 'cheerio';

export interface CrawlResult {
  url: string;
  html: string;
  text: string;
}

const PAGE_KEYWORDS = ['about', 'team', 'contact', 'career', 'leadership'];

export const crawlCompany = async (homepageUrl: string): Promise<string> => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  });
  
  let combinedText = `--- HOMEPAGE: ${homepageUrl} ---\n`;
  const visitedUrls = new Set<string>();
  const urlsToVisit = new Set<string>();
  urlsToVisit.add(homepageUrl);

  try {
    const page = await context.newPage();
    await page.goto(homepageUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const homepageHtml = await page.content();
    const $ = cheerio.load(homepageHtml);
    
    // Extract text from homepage
    $('script, style, noscript, iframe, img, svg').remove();
    combinedText += $('body').text().replace(/\s+/g, ' ').trim() + '\n';
    visitedUrls.add(homepageUrl);

    // Find internal links for About, Contact, Team, Careers
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      let fullUrl = href;
      if (href.startsWith('/')) {
        try {
          const baseUrl = new URL(homepageUrl);
          fullUrl = `${baseUrl.origin}${href}`;
        } catch { return; }
      }

      if (fullUrl.startsWith('http') && fullUrl.includes(new URL(homepageUrl).hostname)) {
        const lowerHref = href.toLowerCase();
        if (PAGE_KEYWORDS.some(kw => lowerHref.includes(kw))) {
          urlsToVisit.add(fullUrl);
        }
      }
    });

    // Visit discovered pages (limit to 4 extra pages)
    const extraUrls = Array.from(urlsToVisit).filter(u => u !== homepageUrl).slice(0, 4);
    
    for (const url of extraUrls) {
      if (visitedUrls.has(url)) continue;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        const html = await page.content();
        const $page = cheerio.load(html);
        $page('script, style, noscript, iframe, img, svg').remove();
        combinedText += `\n--- PAGE: ${url} ---\n`;
        combinedText += $page('body').text().replace(/\s+/g, ' ').trim() + '\n';
        visitedUrls.add(url);
      } catch (err) {
        console.error(`Failed to crawl ${url}`);
      }
    }
  } catch (error) {
    console.error(`Failed to crawl homepage ${homepageUrl}`, error);
  } finally {
    await browser.close();
  }

  // Limit output text length to save tokens (approx 15000 chars is ~3-4k tokens)
  return combinedText.slice(0, 25000);
};
