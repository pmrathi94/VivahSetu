import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PasswordResetSentPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <Heart className="w-12 h-12 text-pink-500 fill-pink-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-gray-600 mb-6">If an account exists for the provided email, a password reset link has been sent.</p>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
