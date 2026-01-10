import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  relation: string;
  rsvpStatus: string;
}

export function GuestsPage() {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relation: 'family'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const response = await apiClient.get('/guests');
      setGuests(response.data);
    } catch (error: any) {
      toast.error('Failed to load guests');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/guests', formData);
      toast.success('Guest added!');
      setFormData({ name: '', email: '', phone: '', relation: 'family' });
      setShowForm(false);
      fetchGuests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add guest');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/guests/${id}`);
      toast.success('Guest removed');
      fetchGuests();
    } catch (error: any) {
      toast.error('Failed to delete guest');
    }
  };

  const exportGuests = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Relation', 'RSVP Status'],
      ...guests.map(g => [g.name, g.email, g.phone, g.relation, g.rsvpStatus])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guests.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Guest List</h1>
          <div className="flex gap-2">
            <button
              onClick={exportGuests}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              <Plus className="w-5 h-5" />
              Add Guest
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Guest name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={formData.relation}
                onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="family">Family</option>
                <option value="friend">Friend</option>
                <option value="colleague">Colleague</option>
                <option value="other">Other</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Guest'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Relation</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">RSVP</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                    No guests added yet
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{guest.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{guest.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{guest.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{guest.relation}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        guest.rsvpStatus === 'yes' ? 'bg-green-100 text-green-700' :
                        guest.rsvpStatus === 'no' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {guest.rsvpStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(guest.id)}
                        className="text-red-600 hover:text-red-700 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
