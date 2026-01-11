import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      toast.success('If that email exists, a reset link was sent.');
      navigate('/password-reset-sent');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <Heart className="w-12 h-12 text-pink-500 fill-pink-500" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Forgot Password</h1>
          <p className="text-center text-gray-600 mb-6">Enter your email and we'll send a reset link.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-4">
            Remembered your password?{' '}
            <a href="/login" className="text-pink-600 hover:underline font-semibold">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
