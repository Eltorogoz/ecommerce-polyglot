import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, endpoints } from '../api/client';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', stock: '' });

  const fetchProducts = async () => {
    try {
      const [productsData, topRatedData] = await Promise.all([
        api.get(endpoints.products),
        api.get(`${endpoints.products}/analytics/top-rated`).catch(() => []),
      ]);
      setProducts(productsData);
      setTopRated(topRatedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(endpoints.products, {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
      });
      setForm({ name: '', description: '', price: '', category: '', stock: '' });
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="text-gray-500">Loading products...</p>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text" placeholder="Product Name" required
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-md px-3 py-2 w-full"
            />
            <input
              type="text" placeholder="Category"
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border rounded-md px-3 py-2 w-full"
            />
            <input
              type="number" step="0.01" placeholder="Price" required
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="border rounded-md px-3 py-2 w-full"
            />
            <input
              type="number" placeholder="Stock" required
              value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="border rounded-md px-3 py-2 w-full"
            />
          </div>
          <textarea
            placeholder="Description" rows={3}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border rounded-md px-3 py-2 w-full"
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Create Product
          </button>
        </form>
      )}

      {topRated.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Rated Products</h2>
          <div className="flex flex-wrap gap-4">
            {topRated.map((p) => (
              <Link
                key={p._id}
                to={`/products/${p._id}`}
                className="bg-white px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 text-yellow-600">★ {p.avgRating?.toFixed(1)}</span>
                <span className="ml-2 text-gray-500 text-sm">({p.reviewCount} reviews)</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} onUpdate={fetchProducts} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-gray-500">No products yet. Add one above!</p>
      )}
    </div>
  );
}

function ProductCard({ product, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(product);

  const handleUpdate = async () => {
    try {
      await api.put(`${endpoints.products}/${product._id}`, form);
      setEditing(false);
      onUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      {editing ? (
        <div className="space-y-3">
          <input
            type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          />
          <input
            type="number" step="0.01" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          />
          <div className="flex gap-2">
            <button onClick={handleUpdate} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
            <button onClick={() => setEditing(false)} className="bg-gray-200 px-3 py-1 rounded text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <Link
              to={`/products/${product._id}`}
              className="font-semibold text-lg text-gray-900 hover:text-primary-600"
            >
              {product.name}
            </Link>
            <span className="text-primary-600 font-bold">${product.price?.toFixed(2)}</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">{product.category || 'Uncategorized'}</p>
          <p className="text-gray-600 text-sm mt-2 line-clamp-2">{product.description}</p>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">Stock: {product.stock}</span>
            <div className="flex items-center gap-3 text-sm">
              <Link
                to={`/products/${product._id}`}
                className="text-primary-600 hover:underline"
              >
                View & Review
              </Link>
              <button
                onClick={() => setEditing(true)}
                className="text-gray-500 hover:underline"
              >
                Edit
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
