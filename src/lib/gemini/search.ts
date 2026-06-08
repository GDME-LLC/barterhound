export type FBListing = {
  id: string;
  title: string;
  priceCents: number;
  url: string;
  location: string;
};

/**
 * Placeholder for Facebook Marketplace search. 
 * This now provides a structure for connecting to a real scraping service like Apify.
 */
export async function searchFacebookMarketplace(query: string, city: string): Promise<FBListing[]> {
  const apiKey = process.env.SCRAPING_API_KEY;

  if (!apiKey) {
    console.warn('No SCRAPING_API_KEY found. Falling back to demo data.');
    return [
      {
        id: 'fb-demo-1',
        title: `Demo: ${query} in ${city}`,
        priceCents: 15000,
        url: 'https://facebook.com/marketplace',
        location: city
      }
    ];
  }

  console.log(`Searching FB Marketplace for ${query} in ${city}...`);

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~facebook-marketplace-scraper/run-sync-get-dataset-items?token=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: city,
          maxResults: 20,
          searchQuery: query,
        }),
      }
    );

    if (!response.ok) throw new Error(`Apify error: ${response.statusText}`);

    const results = await response.json();

    return results.map((item: any) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      title: item.title,
      priceCents: (item.price || 0) * 100,
      url: item.url,
      location: item.locationName || city,
    }));
  } catch (error) {
    console.error('Failed to fetch from Apify:', error);
    return [];
  }
}