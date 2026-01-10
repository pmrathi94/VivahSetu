import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';

interface Media {
  id: string;
  title: string;
  type: string;
  url: string;
  uploadDate: string;
}

export function MediaPage() {
  const navigate = useNavigate();
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await apiClient.get('/media');
      setMediaItems(response.data);
    } catch (error: any) {
      toast.error('Failed to load media');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);

    try {
      await apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Media uploaded!');
      setSelectedFile(null);
      setTitle('');
      fetchMedia();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/media/${id}`);
      toast.success('Media deleted');
      fetchMedia();
    } catch (error: any) {
      toast.error('Failed to delete media');
    }
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

        <h1 className="text-3xl font-bold text-gray-800 mb-8">Media Gallery</h1>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Media title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                accept="image/*,video/*"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {loading ? 'Uploading...' : 'Upload Media'}
            </button>
          </form>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaItems.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-8 text-center text-gray-600">
              No media uploaded yet
            </div>
          ) : (
            mediaItems.map((media) => (
              <div key={media.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                <div className="aspect-square bg-gray-200 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-gray-400" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{media.title}</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    {new Date(media.uploadDate).toLocaleDateString()}
                  </p>
                  <div className="flex justify-between">
                    <a
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-700 text-sm font-semibold"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(media.id)}
                      className="text-red-600 hover:text-red-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
