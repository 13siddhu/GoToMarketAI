import { createObjectCsvWriter } from 'csv-writer';
import { CompanyIntelligence } from '../lib/schema';
import fs from 'fs';
import path from 'path';

export const generateCsvs = async (leads: CompanyIntelligence[], outputDir: string) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const companyCsvPath = path.join(outputDir, 'company_intelligence.csv');
  const contactsCsvPath = path.join(outputDir, 'company_contacts.csv');

  const companyWriter = createObjectCsvWriter({
    path: companyCsvPath,
    header: [
      { id: 'companyName', title: 'Company Name' },
      { id: 'website', title: 'Website' },
      { id: 'industry', title: 'Industry' },
      { id: 'country', title: 'Country' },
      { id: 'state', title: 'State / Region' },
      { id: 'revenueEstimate', title: 'Revenue Estimate' },
      { id: 'employeeCount', title: 'Employee Count' },
      { id: 'companySize', title: 'Company Size' },
      { id: 'techStack', title: 'Tech Stack' },
      { id: 'marketingChannels', title: 'Current Marketing Channels' },
      { id: 'currentCRM', title: 'Current CRM' },
      { id: 'currentAgency', title: 'Current Agency' },
      { id: 'leadSource', title: 'Lead Source' },
      { id: 'status', title: 'Status' },
      { id: 'companyDescription', title: 'Company Description' },
      { id: 'headquartersLocation', title: 'Headquarters Location' },
      { id: 'contactEmail', title: 'Contact Email' },
      { id: 'contactPhone', title: 'Contact Phone' },
      { id: 'revenuePotential', title: 'Revenue Potential Score' },
      { id: 'marketingMaturity', title: 'Marketing Maturity Score' },
      { id: 'aiOpportunity', title: 'AI Opportunity Score' },
      { id: 'strategicFit', title: 'Strategic Fit Score' },
      { id: 'totalScore', title: 'Total Score' },
      { id: 'triggers', title: 'Trigger Events' }
    ]
  });

  const contactsWriter = createObjectCsvWriter({
    path: contactsCsvPath,
    header: [
      { id: 'companyName', title: 'Company Name' },
      { id: 'website', title: 'Website' },
      { id: 'contactName', title: 'Contact Name' },
      { id: 'designation', title: 'Designation' },
      { id: 'contactType', title: 'Contact Type' },
      { id: 'linkedInUrl', title: 'LinkedIn URL' },
      { id: 'publicEmail', title: 'Public Email' },
      { id: 'publicPhoneNumber', title: 'Public Phone Number' },
      { id: 'sourceUrl', title: 'Source URL' },
      { id: 'confidenceScore', title: 'Confidence Score' }
    ]
  });

  const companyRecords = leads.map(lead => {
    // Note: The schema doesn't actually have `companyName` and `website` inside CompanyIntelligence, 
    // but the final schema requested includes it. We will append it before calling this.
    return {
      ...(lead as any),
      techStack: lead.techStack.join(', '),
      marketingChannels: lead.marketingChannels.join(', '),
      triggers: lead.triggers.join(', ')
    };
  });

  const contactRecords: any[] = [];
  leads.forEach((lead: any) => {
    if (lead.contacts) {
      lead.contacts.forEach((contact: any) => {
        contactRecords.push({
          companyName: lead.companyName,
          website: lead.website,
          ...contact
        });
      });
    }
  });

  await companyWriter.writeRecords(companyRecords);
  await contactsWriter.writeRecords(contactRecords);

  return { companyCsvPath, contactsCsvPath };
};
