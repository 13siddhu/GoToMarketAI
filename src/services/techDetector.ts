import axios from 'axios';

export const detectTechStack = async (url: string): Promise<string[]> => {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const html = response.data;
    const headers = JSON.stringify(response.headers).toLowerCase();
    const fullSource = (html + headers).toLowerCase();

    const detected: Set<string> = new Set();

    // Basic Regex/String matching for common technologies
    const techSignatures = [
      { name: 'Shopify', sigs: ['cdn.shopify.com', 'shopify.com'] },
      { name: 'WooCommerce', sigs: ['woocommerce'] },
      { name: 'WordPress', sigs: ['wp-content', 'wp-includes'] },
      { name: 'Magento', sigs: ['mage/cookies', 'magento'] },
      { name: 'Google Analytics', sigs: ['google-analytics.com', 'gtag'] },
      { name: 'Google Tag Manager', sigs: ['googletagmanager.com'] },
      { name: 'Facebook Pixel', sigs: ['connect.facebook.net', 'fbevents.js'] },
      { name: 'Klaviyo', sigs: ['klaviyo.com'] },
      { name: 'Mailchimp', sigs: ['mailchimp.com'] },
      { name: 'HubSpot', sigs: ['hs-scripts.com', 'hubspot'] },
      { name: 'Hotjar', sigs: ['static.hotjar.com'] },
      { name: 'Mixpanel', sigs: ['mixpanel.com'] },
      { name: 'Next.js', sigs: ['_next/static'] },
      { name: 'React', sigs: ['react', 'react-dom'] },
    ];

    techSignatures.forEach(tech => {
      for (const sig of tech.sigs) {
        if (fullSource.includes(sig)) {
          detected.add(tech.name);
          break;
        }
      }
    });

    return Array.from(detected);
  } catch (err) {
    console.error(`Tech detection failed for ${url}:`, err);
    return [];
  }
};
