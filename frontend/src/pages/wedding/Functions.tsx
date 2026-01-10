import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';

interface WeddingFunction {
  id: string;
  name: string;
  date: string;
  location: string;
  type: string;
}

export function FunctionsPage() {
  const navigate = useNavigate();
  const [functions, setFunctions] = useState<WeddingFunction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    type: 'mehendi'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFunctions();
  }, []);

  const fetchFunctions = async () => {
    try {
      const response = await apiClient.get('/functions');
      setFunctions(response.data);
    } catch (error: any) {
      toast.error('Failed to load functions');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/functions', formData);
      toast.success('Function added!');
      setFormData({ name: '', date: '', location: '', type: 'mehendi' });
      setShowForm(false);
      fetchFunctions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add function');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/functions/${id}`);
      toast.success('Function deleted');
      fetchFunctions();
    } catch (error: any) {
      toast.error('Failed to delete function');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Wedding Functions</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            <Plus className="w-5 h-5" />
            Add Function
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Function name (e.g., Mehendi, Sangeet)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="mehendi">Mehendi</option>
                <option value="sangeet">Sangeet</option>
                <option value="haldi">Haldi</option>
                <option value="wedding">Wedding</option>
                <option value="reception">Reception</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Function'}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {functions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              No functions added yet
            </div>
          ) : (
            functions.map((fn) => (
              <div key={fn.id} className="bg-white rounded-lg shadow p-6 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{fn.name}</h3>
                  <p className="text-gray-600">{new Date(fn.date).toLocaleDateString()}</p>
                  <p className="text-gray-500 text-sm">{fn.location}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">
                    {fn.type}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(fn.id)}
                  className="text-red-600 hover:text-red-700 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
