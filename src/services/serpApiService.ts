import axios from 'axios';

export const searchGoogle = async (queries: string[]): Promise<string[]> => {
  const serpApiKey = process.env.SERP_API_KEY;
  if (!serpApiKey) {
    console.warn("No SERP_API_KEY found, using dummy data for testing.");
    return [
      'https://beminimalist.co',
      'https://mamaearth.in',
      'https://plumgoodness.com',
      'https://en.wikipedia.org/wiki/Skincare', // Should be filtered out
      'https://www.amazon.in/skincare', // Should be filtered out
    ];
  }

  const allUrls = new Set<string>();

  // Process up to 2 queries for faster testing
  const queriesToRun = queries.slice(0, 2); 

  for (const query of queriesToRun) {
    try {
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          q: query,
          api_key: serpApiKey,
          num: 40,
        }
      });

      const organicResults = response.data.organic_results;
      if (organicResults && Array.isArray(organicResults)) {
        organicResults.forEach((result: any) => {
          if (result.link) {
            allUrls.add(result.link);
          }
        });
      }
    } catch (error) {
      console.error(`Error fetching results for query: ${query}`, error);
    }
  }

  return Array.from(allUrls);
};
