import { useState, useEffect } from 'react';
import { api, endpoints } from '../api/client';

export default function Home() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(endpoints.health)
      .then(setHealth)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          E-Commerce Polyglot Platform
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          A university demo showcasing polyglot persistence with PostgreSQL and MongoDB
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold text-gray-800">PostgreSQL (Supabase)</h2>
          <p className="mt-2 text-gray-600">
            Handles transactional data requiring ACID compliance:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-500">
            <li>• Users & Authentication</li>
            <li>• Orders & Order Items</li>
            <li>• Payments / Transactions</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold text-gray-800">MongoDB Atlas</h2>
          <p className="mt-2 text-gray-600">
            Handles flexible, document-oriented data:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-500">
            <li>• Products (varying attributes)</li>
            <li>• Reviews (nested, flexible schema)</li>
            <li>• Aggregations & Analytics</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">System Health</h2>
        {loading ? (
          <p className="text-gray-500">Checking connections...</p>
        ) : health ? (
          <div className="flex items-center space-x-6">
            <StatusBadge label="API" ok={health.ok} />
            <StatusBadge label="PostgreSQL" ok={health.postgres} />
            <StatusBadge label="MongoDB" ok={health.mongodb} />
          </div>
        ) : (
          <p className="text-red-500">Could not connect to backend</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ label, ok }) {
  return (
    <div className="flex items-center space-x-2">
      <span
        className={`w-3 h-3 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}
