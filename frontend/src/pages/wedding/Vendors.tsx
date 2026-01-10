import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Star, Share2, Trash2, Plus } from 'lucide-react';
import apiClient from '../../lib/api-client';

interface Vendor {
  vendor_id: string;
  vendor_name: string;
  vendor_type: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  rating: number;
  cost: number;
  payment_status: string;
  shared_toggle: boolean;
  location_cached: {
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('maharashtra');
  const [selectedCity, setSelectedCity] = useState('mumbai');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_type: 'photographer',
    phone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    cost: 0,
  });

  const weddingId = new URLSearchParams(window.location.search).get('wedding_id');

  useEffect(() => {
    fetchVendors();
  }, [weddingId, selectedState, selectedCity]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/weddings/${weddingId}/vendors/by-location?state=${selectedState}&city=${selectedCity}`
      );
      setVendors(response.data);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/weddings/${weddingId}/vendors`, {
        ...formData,
        location_lat: 19.076,
        location_lng: 72.8479,
      });
      fetchVendors();
      setShowForm(false);
      setFormData({
        vendor_name: '',
        vendor_type: 'photographer',
        phone: '',
        email: '',
        address: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        cost: 0,
      });
    } catch (error) {
      console.error('Failed to add vendor:', error);
    }
  };

  const handleDeleteVendor = async (vendor_id: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      try {
        await apiClient.delete(`/weddings/${weddingId}/vendors/${vendor_id}`);
        fetchVendors();
      } catch (error) {
        console.error('Failed to delete vendor:', error);
      }
    }
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Wedding Vendors</h1>
            <p className="text-gray-600">
              Find and manage vendors with OpenStreetMap integration
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
          >
            <Plus size={20} />
            Add Vendor
          </button>
        </div>

        {/* Add Vendor Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Add New Vendor</h2>
            <form onSubmit={handleAddVendor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Vendor Name"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
              <select
                value={formData.vendor_type}
                onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option>photographer</option>
                <option>catering</option>
                <option>decoration</option>
                <option>music</option>
                <option>venue</option>
              </select>
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 md:col-span-2"
              />
              <input
                type="number"
                placeholder="Cost"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Save Vendor
              </button>
            </form>
          </div>
        )}

        {/* Location Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Filter by Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="maharashtra">Maharashtra</option>
                <option value="delhi">Delhi</option>
                <option value="karnataka">Karnataka</option>
                <option value="tamil_nadu">Tamil Nadu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {selectedState === 'maharashtra' && (
                  <>
                    <option value="mumbai">Mumbai</option>
                    <option value="pune">Pune</option>
                    <option value="nashik">Nashik</option>
                  </>
                )}
                {selectedState === 'delhi' && (
                  <option value="delhi">Delhi</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <div key={vendor.vendor_id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 text-white">
                <h3 className="text-lg font-bold">{vendor.vendor_name}</h3>
                <p className="text-pink-100 text-sm capitalize">{vendor.vendor_type}</p>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Rating</span>
                  {getRatingStars(vendor.rating || 0)}
                </div>

                {/* Location */}
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-pink-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p>{vendor.city}, {vendor.state}</p>
                    {vendor.location_cached && (
                      <p className="text-gray-500 text-xs">
                        Coordinates: {vendor.location_cached.coordinates.lat.toFixed(4)}, {vendor.location_cached.coordinates.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact */}
                {vendor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-pink-600" />
                    <a href={`tel:${vendor.phone}`} className="text-blue-600 hover:underline text-sm">
                      {vendor.phone}
                    </a>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-pink-600" />
                    <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline text-sm">
                      {vendor.email}
                    </a>
                  </div>
                )}

                {/* Cost */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">₹{vendor.cost?.toLocaleString()}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    vendor.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {vendor.payment_status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-lg transition">
                    <Share2 size={16} />
                    {vendor.shared_toggle ? 'Shared' : 'Share'}
                  </button>
                  <button
                    onClick={() => handleDeleteVendor(vendor.vendor_id)}
                    className="flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {vendors.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-lg">No vendors found. Add your first vendor!</p>
          </div>
        )}
      </div>
    </div>
  );
}
