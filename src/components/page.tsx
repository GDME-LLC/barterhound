'use client';

import { useState } from 'react';

export default function DealsPage() {
  const [query, setQuery] = useState('PowerEdge');
  const [city, setCity] = useState('Austin');
  const [maxPrice, setMaxPrice] = useState('500');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const scanDeals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/monitor-deals?query=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&maxPrice=${maxPrice}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-orange-600">ServerScout Monitor</h1>
      <p className="text-gray-600 mb-6">Real-time hardware search for home server components.</p>
      
      <div className="flex gap-4 mb-8">
        <input 
          className="border p-2 rounded flex-1" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="e.g. Dell PowerEdge, Xeon E5, Synology"
        />
        <input 
          className="border p-2 rounded w-40" 
          value={city} 
          onChange={(e) => setCity(e.target.value)} 
          placeholder="City"
        />
        <input 
          className="border p-2 rounded w-32" 
          value={maxPrice} 
          onChange={(e) => setMaxPrice(e.target.value)} 
          placeholder="Max Price $"
        />
        <button 
          onClick={scanDeals}
          disabled={loading}
          className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Search'}
        </button>
      </div>

      {results && (
        <div>
          <h2 className="font-semibold mb-4 text-gray-700">Showing {results.foundDeals?.length || 0} listings within budget:</h2>
          <div className="grid gap-4">
            {results.foundDeals?.map((deal: any) => (
              <div key={deal.id} className="border p-4 rounded-lg bg-white shadow-sm border-l-4 border-l-orange-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{deal.title}</h3>
                    <p className="text-sm text-gray-500">Location: {deal.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">${deal.priceCents / 100}</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-4">
                  <a 
                    href={deal.url} 
                    target="_blank" 
                    className="text-orange-500 underline text-sm"
                  >
                    View on Marketplace
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}