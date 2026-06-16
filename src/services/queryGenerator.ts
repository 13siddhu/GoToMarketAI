import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateQueries = async (niche: string, country: string): Promise<string[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    // Fallback if no API key is provided
    console.warn("No GEMINI_API_KEY found, using fallback basic queries.");
    return [
      `top ${niche} brands ${country}`,
      `best ${niche} brands ${country}`,
      `D2C ${niche} brands ${country}`,
      `${niche} startups ${country}`,
      `${niche} companies ${country}`
    ];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an SEO expert. Generate a list of exactly 20 search queries that someone would use to find Direct-to-Consumer (D2C) brands in the following niche and country.
Niche: ${niche}
Country: ${country}

Only return a comma-separated list of search queries. No introductory text, no numbering. Just the queries separated by commas. Example: top skincare brands india, best d2c skincare india, etc.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the comma-separated string into an array
    const queries = text.split(',')
      .map(q => q.trim().replace(/^["']|["']$/g, '').replace(/^\d+\.\s*/, ''))
      .filter(q => q.length > 0);

    // Limit to 50
    return queries.slice(0, 50);
  } catch (error) {
    console.error('Error generating queries via LLM (e.g. 503 high demand):', error);
    console.log("Using fallback queries to keep the system running...");
    return [
      `top ${niche} brands ${country}`,
      `best ${niche} brands ${country}`,
      `D2C ${niche} brands ${country}`,
      `${niche} startups ${country}`,
      `${niche} companies ${country}`,
      `fastest growing ${niche} brands ${country}`,
      `direct to consumer ${niche} brands ${country}`,
      `popular ${niche} brands ${country}`,
      `new ${niche} brands ${country}`,
      `top rated ${niche} brands ${country}`
    ];
  }
};
