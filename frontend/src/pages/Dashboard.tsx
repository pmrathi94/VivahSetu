import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, Users, DollarSign, Music, Camera, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../lib/api-client';

interface Wedding {
  id: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  location: string;
}

export function DashboardPage() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchWeddings();
  }, []);

  const fetchWeddings = async () => {
    try {
      const response = await apiClient.get('/weddings');
      setWeddings(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load weddings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const modules = [
    { icon: Calendar, label: 'Wedding Setup', href: '/wedding/setup' },
    { icon: Music, label: 'Functions', href: '/wedding/functions' },
    { icon: Users, label: 'Guests', href: '/wedding/guests' },
    { icon: DollarSign, label: 'Budget', href: '/wedding/budget' },
    { icon: Camera, label: 'Media', href: '/wedding/media' },
    { icon: Heart, label: 'Chat', href: '/wedding/chat' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-600 fill-pink-600" />
            <h1 className="text-2xl font-bold text-gray-800">VivahSetu</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user.fullName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-pink-600 transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Weddings Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">My Weddings</h2>
            <button
              onClick={() => navigate('/wedding/create')}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Create New Wedding
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : weddings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Heart className="w-16 h-16 text-pink-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No weddings yet. Create your first wedding!</p>
              <button
                onClick={() => navigate('/wedding/create')}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Create Wedding
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {weddings.map((wedding) => (
                <div
                  key={wedding.id}
                  onClick={() => navigate(`/wedding/${wedding.id}`)}
                  className="bg-white rounded-lg shadow hover:shadow-lg p-6 cursor-pointer transition"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {wedding.brideName} & {wedding.groomName}
                  </h3>
                  <p className="text-gray-600">{new Date(wedding.weddingDate).toLocaleDateString()}</p>
                  <p className="text-gray-500 text-sm">{wedding.location}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Modules Grid */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {modules.map((mod) => (
              <a
                key={mod.href}
                href={mod.href}
                className="bg-white rounded-lg shadow hover:shadow-lg p-6 flex flex-col items-center justify-center gap-3 transition hover:bg-pink-50"
              >
                <mod.icon className="w-8 h-8 text-pink-600" />
                <span className="text-sm font-semibold text-center text-gray-700">{mod.label}</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
