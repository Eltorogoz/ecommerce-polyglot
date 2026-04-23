import { useState, useEffect } from 'react';
import { api, endpoints } from '../api/client';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: '', items: [{ productId: '', quantity: 1 }] });

  const fetchData = async () => {
    try {
      const [ordersData, usersData, productsData] = await Promise.all([
        api.get(endpoints.orders),
        api.get(endpoints.users).catch(() => []),
        api.get(endpoints.products).catch(() => []),
      ]);
      setOrders(ordersData);
      setUsers(usersData);
      setProducts(productsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { productId: '', quantity: 1 }] });
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx][field] = field === 'quantity' ? parseInt(value, 10) : value;
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const validItems = form.items.filter(i => i.productId && i.quantity > 0);
      if (!form.userId || validItems.length === 0) {
        alert('Select a user and add at least one product');
        return;
      }
      await api.post(endpoints.orders, { userId: parseInt(form.userId), items: validItems });
      setForm({ userId: '', items: [{ productId: '', quantity: 1 }] });
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="text-gray-500">Loading orders...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          {showForm ? 'Cancel' : 'New Order'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="border rounded-md px-3 py-2 w-full"
              required
            >
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Items</label>
            {form.items.map((item, idx) => (
              <div key={idx} className="flex gap-3 mb-2">
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                  className="border rounded-md px-3 py-2 flex-1"
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} (${p.price})</option>
                  ))}
                </select>
                <input
                  type="number" min="1" value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  className="border rounded-md px-3 py-2 w-20"
                />
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-primary-600 text-sm hover:underline">
              + Add another item
            </button>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Create Order
          </button>
        </form>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onUpdate={fetchData} />
        ))}
      </div>

      {orders.length === 0 && (
        <p className="text-center text-gray-500">No orders yet. Create one above!</p>
      )}
    </div>
  );
}

function OrderCard({ order, onUpdate }) {
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await api.put(`${endpoints.orders}/${order.id}`, { status });
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
          <p className="text-sm text-gray-500">
            {order.user_name || `User #${order.user_id}`} • {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
          {order.status}
        </span>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
          <ul className="space-y-1">
            {order.items.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-600">
                {item.product_name || item.product_id} × {item.quantity} — ${(item.unit_price * item.quantity).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center border-t pt-4">
        <span className="text-lg font-bold text-gray-900">
          Total: ${parseFloat(order.total_amount || 0).toFixed(2)}
        </span>
        <div className="flex gap-2">
          {order.status === 'pending' && (
            <button
              onClick={() => updateStatus('processing')}
              disabled={updating}
              className="text-blue-600 text-sm hover:underline disabled:opacity-50"
            >
              Process
            </button>
          )}
          {order.status === 'processing' && (
            <button
              onClick={() => updateStatus('shipped')}
              disabled={updating}
              className="text-purple-600 text-sm hover:underline disabled:opacity-50"
            >
              Ship
            </button>
          )}
          {order.status === 'shipped' && (
            <button
              onClick={() => updateStatus('delivered')}
              disabled={updating}
              className="text-green-600 text-sm hover:underline disabled:opacity-50"
            >
              Mark Delivered
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
