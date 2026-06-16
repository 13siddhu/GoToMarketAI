import axios from 'axios';
import { ContactIntelligence } from '../lib/schema';

export const enrichDecisionMakers = async (
  companyName: string, 
  contacts: ContactIntelligence[]
): Promise<ContactIntelligence[]> => {
  const serpApiKey = process.env.SERP_API_KEY;
  if (!serpApiKey) {
    console.warn("SERP_API_KEY not found. Skipping LinkedIn enrichment.");
    return contacts;
  }

  const enrichedContacts = [...contacts];

  for (const contact of enrichedContacts) {
    // If the AI found a name but couldn't find a direct LinkedIn URL on the website
    if (!contact.linkedInUrl && contact.contactName) {
      try {
        const query = `${companyName} ${contact.contactName} ${contact.designation} site:linkedin.com/in/`;
        const response = await axios.get('https://serpapi.com/search.json', {
          params: { q: query, api_key: serpApiKey, num: 3 }
        });

        const organicResults = response.data.organic_results;
        if (organicResults && organicResults.length > 0) {
          const firstHit = organicResults[0];
          // Simple verification that it's a profile URL
          if (firstHit.link && firstHit.link.includes('linkedin.com/in/')) {
            contact.linkedInUrl = firstHit.link;
            contact.sourceUrl = contact.sourceUrl || firstHit.link;
            contact.confidenceScore = Math.min(100, contact.confidenceScore + 20);
          }
        }
      } catch (err) {
        console.error(`Failed to enrich contact ${contact.contactName}`, err);
      }
    }
  }

  return enrichedContacts;
};
