import { useState, useEffect } from 'react';
import { api, endpoints } from '../api/client';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '' });

  const fetchUsers = async () => {
    try {
      const data = await api.get(endpoints.users);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(endpoints.users, form);
      setForm({ email: '', name: '', password: '' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="text-gray-500">Loading users...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="text" placeholder="Name" required
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-md px-3 py-2 w-full"
            />
            <input
              type="email" placeholder="Email" required
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border rounded-md px-3 py-2 w-full"
            />
            <input
              type="password" placeholder="Password" required
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border rounded-md px-3 py-2 w-full"
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Create User
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <UserRow key={user.id} user={user} onUpdate={fetchUsers} />
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="text-center text-gray-500">No users yet. Add one above!</p>
      )}
    </div>
  );
}

function UserRow({ user, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name, email: user.email });

  const handleUpdate = async () => {
    try {
      await api.put(`${endpoints.users}/${user.id}`, form);
      setEditing(false);
      onUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <tr>
      <td className="px-6 py-4 text-sm text-gray-500">{user.id}</td>
      <td className="px-6 py-4">
        {editing ? (
          <input
            type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-2 py-1 text-sm"
          />
        ) : (
          <span className="text-sm font-medium text-gray-900">{user.name}</span>
        )}
      </td>
      <td className="px-6 py-4">
        {editing ? (
          <input
            type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border rounded px-2 py-1 text-sm"
          />
        ) : (
          <span className="text-sm text-gray-500">{user.email}</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-sm">
        {editing ? (
          <div className="flex gap-2">
            <button onClick={handleUpdate} className="text-green-600 hover:underline">Save</button>
            <button onClick={() => setEditing(false)} className="text-gray-500 hover:underline">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-primary-600 hover:underline">Edit</button>
        )}
      </td>
    </tr>
  );
}
