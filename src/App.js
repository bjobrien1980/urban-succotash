import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, Search, Bell, TrendingUp, AlertCircle, Users } from 'lucide-react';
import UnionPosts from './components/UnionPosts';
import MarketOverview from './components/MarketOverview';
import NewsFilters from './components/NewsFilters';
import NewsFeed from './components/NewsFeed';
import { useNewsData } from './hooks/useNewsData';
import { useMarketData } from './hooks/useMarketData';

const UnionMonitorDashboard = () => {
  // Basic UI state
  const [selectedUnion, setSelectedUnion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedMarketCategory, setSelectedMarketCategory] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Custom hooks for data management
  const {
    unionNews,
    marketNewsData,
    newsLoading,
    isSearching: newsSearching,
    refreshNews
  } = useNewsData();

  const {
    marketData,
    isSearching: marketSearching,
    refreshMarketData
  } = useMarketData();

  // Combined searching state
  const isSearching = newsSearching || marketSearching;

  // Refresh all data
  const refreshAll = async () => {
    await Promise.all([refreshNews(), refreshMarketData()]);
    setLastUpdated(new Date());
  };

  // Load data on component mount
  useEffect(() => {
    refreshAll();
  }, []);

  // Mock data fallbacks
  const mockUnionData = [
    {
      id: 'mock_1',
      union: 'System Message',
      category: 'General',
      urgency: 'low',
      title: 'No live union news available',
      summary: 'Unable to fetch live union news at this time. This may be due to API limitations or no recent relevant news.',
      timestamp: '1 hour ago',
      source: 'System',
      location: 'WA',
      thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop'
    }
  ];

  const mockMarketData = [
    {
      id: 'mock_market_1',
      company: 'System Message',
      title: 'No live market news available',
      summary: 'Unable to fetch live market news at this time. This may be due to API limitations or no recent relevant news.',
      timestamp: '1 hour ago',
      source: 'System',
      category: 'General',
      urgency: 'low',
      thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop'
    }
  ];

  // Data with fallbacks
  const currentUnionData = unionNews.length > 0 ? unionNews : mockUnionData;
  const currentMarketData = marketNewsData.length > 0 ? marketNewsData : mockMarketData;

  // Filter data based on selected filters
  const filteredUnionData = currentUnionData.filter(item => {
    if (selectedUnion !== 'all' && item.union !== selectedUnion) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const filteredMarketNews = currentMarketData.filter(item => {
    if (selectedCompany !== 'all' && item.company !== selectedCompany) return false;
    if (selectedMarketCategory !== 'all' && item.category !== selectedMarketCategory) return false;
    return true;
  });

  // Statistics for summary cards
  const todayStats = {
    total: currentUnionData.length,
    high: currentUnionData.filter(item => item.urgency === 'high').length,
    medium: currentUnionData.filter(item => item.urgency === 'medium').length,
    low: currentUnionData.filter(item => item.urgency === 'low').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="relative h-96 overflow-hidden">
          <img 
            src="https://raw.githubusercontent.com/bjobrien1980/urban-succotash/main/u8472312112_Iron_ore_mining_in_the_Pilbara_dump_truck_sunset__99ab4882-e736-4098-8d4e-79b5ab9aaaa4_3.png"
            alt="Iron ore mining in the Pilbara"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-6xl font-bold text-white">Pilbara Watch</h1>
                  <p className="text-xl text-gray-200 mt-2">Latest market information about Western Australia's iron ore industry</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-200 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Last updated: {lastUpdated.toLocaleTimeString()}
                    <span className="ml-2 text-xs opacity-75">
                      (Cache: 120min)
                    </span>
                  </div>
                  <button 
                    onClick={refreshAll}
                    disabled={isSearching}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <RotateCcw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                    <span>{isSearching ? 'Searching...' : 'Refresh Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Market Overview Component */}
        <MarketOverview marketData={marketData} />

        {/* Union Posts Component */}
        <UnionPosts />

        {/* Summary Cards */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Bell className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-600">Total Updates</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{todayStats.total}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-gray-600">High Priority</span>
              </div>
              <p className="text-xl font-bold text-red-600">{todayStats.high}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium text-gray-600">Medium Priority</span>
              </div>
              <p className="text-xl font-bold text-yellow-600">{todayStats.medium}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-gray-600">Low Priority</span>
              </div>
              <p className="text-xl font-bold text-green-600">{todayStats.low}</p>
            </div>
          </div>
        </div>

        {/* Filters Component */}
        <NewsFilters
          selectedUnion={selectedUnion}
          setSelectedUnion={setSelectedUnion}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedCompany={selectedCompany}
          setSelectedCompany={setSelectedCompany}
          selectedMarketCategory={selectedMarketCategory}
          setSelectedMarketCategory={setSelectedMarketCategory}
        />

        {/* Search Status */}
        {(isSearching || newsLoading) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <RotateCcw className="w-5 h-5 text-blue-600 animate-spin mr-2" />
              <p className="text-blue-800">Searching for latest union activity and market news...</p>
            </div>
          </div>
        )}

        {/* News Feed Component */}
        <NewsFeed
          filteredUnionData={filteredUnionData}
          filteredMarketNews={filteredMarketNews}
          unionNewsCount={unionNews.length}
          marketNewsCount={marketNewsData.length}
        />
      </div>
    </div>
  );
};

export default UnionMonitorDashboard;
