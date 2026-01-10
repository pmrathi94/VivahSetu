import React, { useEffect, useState } from 'react';
import { CheckCircle2, Plus, Trash2, Download } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface PackingItem {
  id: string;
  item: string;
  category: string;
  completed: boolean;
}

interface PackingList {
  list_id: string;
  function_id?: string;
  items_json: PackingItem[];
  honeymoon_toggle: boolean;
  assistance_enabled: boolean;
  completion_percentage: number;
}

export function PackingPage() {
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<PackingList | null>(null);
  const [newItem, setNewItem] = useState('');
  const [itemCategory, setItemCategory] = useState('clothes');

  const weddingId = new URLSearchParams(window.location.search).get('wedding_id');

  const categories = [
    'clothes',
    'jewelry',
    'shoes',
    'skincare',
    'makeup',
    'documents',
    'accessories',
    'other',
  ];

  useEffect(() => {
    // Fetch packing lists - this would normally come from API
    loadMockData();
  }, [weddingId]);

  const loadMockData = () => {
    setPackingLists([
      {
        list_id: '1',
        function_id: 'haldi',
        items_json: [
          { id: '1', item: 'Haldi dress', category: 'clothes', completed: true },
          { id: '2', item: 'Bangles', category: 'jewelry', completed: false },
          { id: '3', item: 'Turmeric paste', category: 'skincare', completed: true },
        ],
        honeymoon_toggle: false,
        assistance_enabled: true,
        completion_percentage: 66,
      },
      {
        list_id: '2',
        function_id: 'wedding',
        items_json: [
          { id: '1', item: 'Bridal lehenga', category: 'clothes', completed: false },
          { id: '2', item: 'Bridal jewelry set', category: 'jewelry', completed: false },
          { id: '3', item: 'Heels', category: 'shoes', completed: false },
        ],
        honeymoon_toggle: false,
        assistance_enabled: true,
        completion_percentage: 0,
      },
      {
        list_id: '3',
        items_json: [
          { id: '1', item: 'Passport', category: 'documents', completed: true },
          { id: '2', item: 'Luggage', category: 'accessories', completed: false },
          { id: '3', item: 'Summer dresses', category: 'clothes', completed: false },
        ],
        honeymoon_toggle: true,
        assistance_enabled: true,
        completion_percentage: 33,
      },
    ]);
    setLoading(false);
  };

  const handleAddItem = () => {
    if (!selectedList || !newItem.trim()) return;

    const updatedList = {
      ...selectedList,
      items_json: [
        ...selectedList.items_json,
        {
          id: Date.now().toString(),
          item: newItem,
          category: itemCategory,
          completed: false,
        },
      ],
    };

    const updatedLists = packingLists.map((list) =>
      list.list_id === selectedList.list_id ? updatedList : list
    );

    setPackingLists(updatedLists);
    setSelectedList(updatedList);
    setNewItem('');
  };

  const handleToggleItem = (itemId: string) => {
    if (!selectedList) return;

    const updatedItems = selectedList.items_json.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const completed = updatedItems.filter((i) => i.completed).length;
    const completionPercentage = Math.round((completed / updatedItems.length) * 100);

    const updatedList = {
      ...selectedList,
      items_json: updatedItems,
      completion_percentage: completionPercentage,
    };

    const updatedLists = packingLists.map((list) =>
      list.list_id === selectedList.list_id ? updatedList : list
    );

    setPackingLists(updatedLists);
    setSelectedList(updatedList);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedList) return;

    const updatedItems = selectedList.items_json.filter((item) => item.id !== itemId);
    const completed = updatedItems.filter((i) => i.completed).length;
    const completionPercentage = updatedItems.length > 0 ? Math.round((completed / updatedItems.length) * 100) : 0;

    const updatedList = {
      ...selectedList,
      items_json: updatedItems,
      completion_percentage: completionPercentage,
    };

    const updatedLists = packingLists.map((list) =>
      list.list_id === selectedList.list_id ? updatedList : list
    );

    setPackingLists(updatedLists);
    setSelectedList(updatedList);
  };

  const handleExport = async () => {
    if (!selectedList) return;

    try {
      const response = await apiClient.get(
        `/weddings/${weddingId}/packing/${selectedList.list_id}/export?format=pdf`
      );
      console.log('Export data:', response.data);
      alert('Packing list exported! (Check console for details)');
    } catch (error) {
      console.error('Failed to export:', error);
    }
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Packing Lists</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Packing Lists Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Lists</h2>
              <div className="space-y-3">
                {packingLists.map((list, index) => {
                  const title = list.honeymoon_toggle
                    ? 'Honeymoon Packing'
                    : `Function ${index + 1} Packing`;

                  return (
                    <button
                      key={list.list_id}
                      onClick={() => setSelectedList(list)}
                      className={`w-full text-left p-4 rounded-lg transition ${
                        selectedList?.list_id === list.list_id
                          ? 'bg-pink-600 text-white shadow-lg'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="font-semibold">{title}</p>
                      <div className="mt-2 w-full bg-gray-300 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            selectedList?.list_id === list.list_id ? 'bg-white' : 'bg-pink-500'
                          }`}
                          style={{
                            width: `${list.completion_percentage}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs mt-1">
                        {selectedList?.list_id === list.list_id ? '' : ''}
                        {list.completion_percentage}% complete
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Packing Items */}
          <div className="lg:col-span-2">
            {selectedList ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedList.honeymoon_toggle ? 'Honeymoon' : 'Function'} Packing List
                    </h2>
                    {selectedList.honeymoon_toggle && (
                      <p className="text-sm text-purple-600 font-semibold mt-1">🌙 Honeymoon Trip</p>
                    )}
                  </div>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    <Download size={18} />
                    Export
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">Progress</span>
                    <span className="text-lg font-bold text-pink-600">
                      {selectedList.completion_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${selectedList.completion_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Assistance Toggle */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Get Help with Packing</p>
                    <p className="text-sm text-gray-600">Let family & friends assist</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedList.assistance_enabled}
                      readOnly
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {/* Add Item */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Add Item
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Item name..."
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="capitalize">
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddItem}
                      className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <Plus size={18} />
                      Add
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {selectedList.items_json.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <button
                        onClick={() => handleToggleItem(item.id)}
                        className="flex-shrink-0"
                      >
                        {item.completed ? (
                          <CheckCircle2 size={24} className="text-green-600" />
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full hover:border-pink-500 transition"></div>
                        )}
                      </button>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            item.completed
                              ? 'text-gray-400 line-through'
                              : 'text-gray-900'
                          }`}
                        >
                          {item.item}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                {selectedList.items_json.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No items yet. Add your first item above!
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <p className="text-gray-600 text-lg">Select a packing list to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
