import React, { useState, useEffect } from 'react';
import { Search, Bell, TrendingUp, AlertCircle, Users, MapPin, Clock, ExternalLink, RotateCcw } from 'lucide-react';

const UnionMonitorDashboard = () => {
  const [selectedUnion, setSelectedUnion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // State for market data (will be populated with real data)
  const [marketData, setMarketData] = useState({
    ironOre: {
      price: 118.45,
      changePercent: +2.42,
      source: 'Manual Update'
    },
    companies: [
      { name: 'BHP Group', ticker: 'BHP.AX', price: '42.85', changePercent: '+1.78', source: 'Loading...' },
      { name: 'Rio Tinto', ticker: 'RIO.AX', price: '124.20', changePercent: '-1.11', source: 'Loading...' },
      { name: 'Fortescue', ticker: 'FMG.AX', price: '18.95', changePercent: '+2.43', source: 'Loading...' }
    ],
    economicData: [
      { label: 'CPI', value: '3.4%', change: '+0.2%', trend: 'up', source: 'ABS (Manual)' },
      { label: 'WA Unemp', value: '3.8%', change: '-0.1%', trend: 'down', source: 'ABS (Manual)' },
      { label: 'AUD/USD', value: '0.6785', change: '+0.0045', trend: 'up', source: 'Manual' }
    ]
  });

  // State for real news data
  const [unionNews, setUnionNews] = useState([]);
  const [marketNewsData, setMarketNewsData] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Function to fetch real stock data
  const fetchRealData = async () => {
    try {
      console.log('Fetching stock data...');
      const stockSymbols = ['BHP.AX', 'RIO.AX', 'FMG.AX'];
      const stockPromises = stockSymbols.map(async symbol => {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
        return response.json();
      });
      
      const stockResults = await Promise.all(stockPromises);
      console.log('Stock results:', stockResults);
      
      const companies = stockResults.map((result, index) => {
        try {
          const data = result.chart.result[0];
          const currentPrice = data.meta.regularMarketPrice;
          const previousClose = data.meta.previousClose;
          const change = ((currentPrice - previousClose) / previousClose * 100);
          
          const names = ['BHP Group', 'Rio Tinto', 'Fortescue'];
          return {
            name: names[index],
            ticker: stockSymbols[index],
            price: currentPrice?.toFixed(2) || 'N/A',
            changePercent: change?.toFixed(2) || '0.00',
            source: 'Yahoo Finance'
          };
        } catch (error) {
          console.error(`Error processing ${stockSymbols[index]}:`, error);
          return {
            name: ['BHP Group', 'Rio Tinto', 'Fortescue'][index],
            ticker: stockSymbols[index],
            price: 'N/A',
            changePercent: '0.00',
            source: 'Error'
          };
        }
      });

      console.log('Processed companies:', companies);
      setMarketData(prev => ({
        ...prev,
        companies: companies
      }));

    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  // Function to fetch real union news
  const fetchUnionNews = async () => {
    try {
      console.log('Fetching union news...');
      setNewsLoading(true);
      
      const query = encodeURIComponent('("Western Australia" OR "WA" OR "Pilbara") AND ("union" OR "strike" OR "workers" OR "industrial action" OR "enterprise bargaining")');
      const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=15&apiKey=8c9a0321ff654f6782724d40ad436f1f`;
      
      console.log('Union news URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Union news response:', data);
      
      if (data.articles && data.articles.length > 0) {
        const processedNews = data.articles
          .filter(article => article.title && article.description)
          .map((article, index) => ({
            id: `union_${index}`,
            union: determineUnion(article.title + ' ' + article.description),
            category: determineCategory(article.title + ' ' + article.description),
            urgency: determineUrgency(article.title + ' ' + article.description),
            title: article.title,
            summary: article.description || 'No summary available.',
            timestamp: formatTimestamp(article.publishedAt),
            source: article.source.name,
            location: 'WA',
            thumbnail: article.urlToImage || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
            url: article.url
          }));
        
        console.log('Processed union news:', processedNews);
        setUnionNews(processedNews);
      } else {
        console.log('No union articles found');
      }
    } catch (error) {
      console.error('Error fetching union news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  // Function to fetch real market news
  const fetchMarketNews = async () => {
    try {
      console.log('Fetching market news...');
      
      const query = encodeURIComponent('("BHP" OR "Rio Tinto" OR "Fortescue" OR "iron ore") AND ("Western Australia" OR "Pilbara" OR "mining")');
      const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=15&apiKey=8c9a0321ff654f6782724d40ad436f1f`;
      
      console.log('Market news URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Market news response:', data);
      
      if (data.articles && data.articles.length > 0) {
        const processedNews = data.articles
          .filter(article => article.title && article.description)
          .map((article, index) => ({
            id: `market_${index}`,
            company: determineCompany(article.title + ' ' + article.description),
            title: article.title,
            summary: article.description || 'No summary available.',
            timestamp: formatTimestamp(article.publishedAt),
            source: article.source.name,
            category: determineMarketCategory(article.title + ' ' + article.description),
            urgency: determineUrgency(article.title + ' ' + article.description),
            thumbnail: article.urlToImage || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
            url: article.url
          }));
        
        console.log('Processed market news:', processedNews);
        setMarketNewsData(processedNews);
      } else {
        console.log('No market articles found');
      }
    } catch (error) {
      console.error('Error fetching market news:', error);
    }
  };

  // Helper functions to categorize news
  const determineUnion = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('mining and energy union') || lowerText.includes('meu')) return 'Mining and Energy Union';
    if (lowerText.includes('australian workers union') || lowerText.includes('awu')) return 'Australian Workers Union';
    if (lowerText.includes('maritime union') || lowerText.includes('mua')) return 'Maritime Union of Australia';
    if (lowerText.includes('electrical trades union') || lowerText.includes('etu')) return 'Electrical Trades Union';
    if (lowerText.includes('manufacturing workers union') || lowerText.includes('amwu')) return 'Australian Manufacturing Workers Union';
    if (lowerText.includes('western mine workers alliance') || lowerText.includes('wmwa')) return 'Western Mine Workers Alliance';
    return 'Mining Unions';
  };

  const determineCompany = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('bhp')) return 'BHP';
    if (lowerText.includes('rio tinto')) return 'Rio Tinto';
    if (lowerText.includes('fortescue') || lowerText.includes('fmg')) return 'Fortescue';
    if (lowerText.includes('hancock')) return 'Hancock Iron Ore';
    if (lowerText.includes('mineral resources') || lowerText.includes('minres')) return 'Mineral Resources';
    return 'Mining Industry';
  };

  const determineCategory = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('strike') || lowerText.includes('industrial action')) return 'Strike Action';
    if (lowerText.includes('negotiat') || lowerText.includes('bargain') || lowerText.includes('agreement')) return 'Negotiations';
    if (lowerText.includes('safety') || lowerText.includes('accident') || lowerText.includes('incident')) return 'Safety';
    if (lowerText.includes('policy') || lowerText.includes('regulation') || lowerText.includes('law')) return 'Policy Change';
    if (lowerText.includes('member') || lowerText.includes('join')) return 'Membership';
    return 'General';
  };

  const determineMarketCategory = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('expansion') || lowerText.includes('project') || lowerText.includes('investment') || lowerText.includes('billion')) return 'Expansion';
    if (lowerText.includes('production') || lowerText.includes('output') || lowerText.includes('shipment') || lowerText.includes('record')) return 'Production';
    if (lowerText.includes('environment') || lowerText.includes('renewable') || lowerText.includes('sustainability') || lowerText.includes('carbon')) return 'Sustainability';
    if (lowerText.includes('approval') || lowerText.includes('regulation') || lowerText.includes('government') || lowerText.includes('permit')) return 'Regulatory';
    if (lowerText.includes('contract') || lowerText.includes('deal') || lowerText.includes('agreement') || lowerText.includes('supply')) return 'Commercial';
    return 'General';
  };

  const determineUrgency = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('strike') || lowerText.includes('urgent') || lowerText.includes('crisis') || lowerText.includes('emergency') || lowerText.includes('billion')) return 'high';
    if (lowerText.includes('negotiat') || lowerText.includes('dispute') || lowerText.includes('concern') || lowerText.includes('expansion') || lowerText.includes('record')) return 'medium';
    return 'low';
  };

  const formatTimestamp = (publishedAt) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffHours = Math.floor((now - published) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  // Fetch real data when component loads
  useEffect(() => {
    fetchRealData();
    fetchUnionNews();
    fetchMarketNews();
  }, []);

  const unions = [
    'Australian Workers Union',
    'Western Mine Workers Alliance', 
    'Australian Manufacturing Workers Union',
    'Electrical Trades Union',
    'Mining and Energy Union',
    'Maritime Union of Australia',
    'Offshore Alliance'
  ];

  // Mock data - only used as fallback
  const mockUnionData = [
    {
      id: 'mock_1',
      union: 'No Live Data',
      category: 'General',
      urgency: 'low',
      title: 'No union news found - check API connection',
      summary: 'Unable to fetch live union news. Please check the news API connection.',
      timestamp: '1 hour ago',
      source: 'System Message',
      location: 'WA',
      thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop'
    }
  ];

  const mockMarketData = [
    {
      id: 'mock_market_1',
      company: 'No Live Data',
      title: 'No market news found - check API connection',
      summary: 'Unable to fetch live market news. Please check the news API connection.',
      timestamp: '1 hour ago',
      source: 'System Message',
      category: 'General',
      urgency: 'low',
      thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop'
    }
  ];

  const categories = ['Strike Action', 'Negotiations', 'Policy Change', 'Safety', 'Membership'];
  const marketCategories = ['Expansion', 'Production', 'Sustainability', 'Regulatory', 'Commercial'];
  const companies = ['BHP', 'Rio Tinto', 'Fortescue', 'Hancock Iron Ore', 'Mineral Resources'];
  
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedMarketCategory, setSelectedMarketCategory] = useState('all');
  
  const urgencyColors = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-yellow-500 bg-yellow-50', 
    low: 'border-green-500 bg-green-50'
  };

  const urgencyIcons = {
    high: <AlertCircle className="w-4 h-4 text-red-500" />,
    medium: <TrendingUp className="w-4 h-4 text-yellow-500" />,
    low: <Users className="w-4 h-4 text-green-500" />
  };

  // Use real news data if available, otherwise fall back to mock data
  const currentUnionData = unionNews.length > 0 ? unionNews : mockUnionData;
  const currentMarketData = marketNewsData.length > 0 ? marketNewsData : mockMarketData;

  const filteredData = currentUnionData.filter(item => {
    if (selectedUnion !== 'all' && item.union !== selectedUnion) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const filteredMarketNews = currentMarketData.filter(item => {
    if (selectedCompany !== 'all' && item.company !== selectedCompany) return false;
    if (selectedMarketCategory !== 'all' && item.category !== selectedMarketCategory) return false;
    return true;
  });

  const simulateSearch = async () => {
    setIsSearching(true);
    console.log('Manual refresh triggered...');
    await Promise.all([
      fetchRealData(),
      fetchUnionNews(),
      fetchMarketNews()
    ]);
    setLastUpdated(new Date());
    setIsSearching(false);
  };

  const todayStats = {
    total: currentUnionData.length,
    high: currentUnionData.filter(item => item.urgency === 'high').length,
    medium: currentUnionData.filter(item => item.urgency === 'medium').length,
    low: currentUnionData.filter(item => item.urgency === 'low').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - FIXED TO h-96 */}
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
                  </div>
                  <button 
                    onClick={simulateSearch}
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
        {/* Market Overview */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Market Overview</h2>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              
              {/* Iron Ore Price */}
              <div className="lg:col-span-1">
                <h3 className="text-xs font-medium text-gray-600 mb-1">Iron Ore (62% Fe CFR)</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold text-gray-900">${marketData.ironOre.price}</span>
                  <span className="text-xs text-gray-600">/t</span>
                </div>
                <div className={`text-xs font-medium ${marketData.ironOre.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {marketData.ironOre.changePercent >= 0 ? '↗' : '↘'} {marketData.ironOre.changePercent >= 0 ? '+' : ''}{marketData.ironOre.changePercent}%
                </div>
                <div className="text-xs text-gray-400">{marketData.ironOre.source}</div>
              </div>

              {/* Company Stock Prices */}
              <div className="lg:col-span-2">
                <h3 className="text-xs font-medium text-gray-600 mb-2">Major Miners (ASX)</h3>
                <div className="grid grid-cols-3 gap-3">
                  {marketData.companies.map((company, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs font-medium text-gray-700">{company.name}</div>
                      <div className="text-sm font-bold text-gray-900">${company.price}</div>
                      <div className={`text-xs font-medium ${parseFloat(company.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(company.changePercent) >= 0 ? '+' : ''}{company.changePercent}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Economic Indicators */}
              <div className="lg:col-span-1">
                <h3 className="text-xs font-medium text-gray-600 mb-2">Key Indicators</h3>
                <div className="grid grid-cols-3 gap-1">
                  {marketData.economicData.slice(0, 3).map((indicator, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs font-medium text-gray-700">{indicator.label}</div>
                      <div className="text-sm font-bold text-gray-900">{indicator.value}</div>
                      <div className={`text-xs font-medium ${indicator.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {indicator.trend === 'up' ? '↗' : '↘'} {indicator.change}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

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

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Union</label>
              <select 
                value={selectedUnion} 
                onChange={(e) => setSelectedUnion(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Unions</option>
                {unions.map(union => (
                  <option key={union} value={union}>{union}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Status */}
        {(isSearching || newsLoading) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <RotateCcw className="w-5 h-5 text-blue-600 animate-spin mr-2" />
              <p className="text-blue-800">Searching for latest union activity and market news...</p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-gray-100 rounded-lg p-3 mb-6 text-xs">
          <strong>Debug Info:</strong> Union articles: {unionNews.length} | Market articles: {marketNewsData.length} | 
          Stock data source: {marketData.companies[0]?.source || 'Loading'} | 
          News loading: {newsLoading ? 'Yes' : 'No'}
        </div>

        {/* News Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Union Activity Feed */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Union Activity Feed 
              {unionNews.length > 0 && <span className="text-sm text-green-600 ml-2">● Live ({unionNews.length} articles)</span>}
              {unionNews.length === 0 && <span className="text-sm text-red-600 ml-2">● No Live Data</span>}
            </h2>
            <div className="space-y-4">
              {filteredData.map(item => (
                <div key={item.id} className={`bg-white rounded-lg shadow-sm border-l-4 ${urgencyColors[item.urgency]} p-6`}>
                  <div className="flex items-start space-x-4">
                    <img 
                      src={item.thumbnail} 
                      alt={item.title}
                      className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop';
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {urgencyIcons[item.urgency]}
                        <span className="text-sm font-medium text-gray-600">{item.union}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{item.category}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {item.location}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-700 mb-3">{item.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {item.timestamp}
                          </span>
                          <span>Source: {item.source}</span>
                        </div>
                        <button 
                          onClick={() => item.url && window.open(item.url, '_blank')}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Read Full Article</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredData.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No union updates found</h3>
                  <p className="text-gray-600">No union activity matches your current filters. Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          </div>

          {/* Market Watch Feed */}
          <div>
            <h2 className="text-lg font-semibold text-gray
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
             Market Watch - WA Iron Ore Miners
             {marketNewsData.length > 0 && <span className="text-sm text-green-600 ml-2">● Live ({marketNewsData.length} articles)</span>}
             {marketNewsData.length === 0 && <span className="text-sm text-red-600 ml-2">● No Live Data</span>}
           </h2>
           
           {/* Market Filters */}
           <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
             <div className="flex flex-wrap gap-3">
               <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                 <select 
                   value={selectedCompany} 
                   onChange={(e) => setSelectedCompany(e.target.value)}
                   className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   <option value="all">All Companies</option>
                   {companies.map(company => (
                     <option key={company} value={company}>{company}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                 <select 
                   value={selectedMarketCategory} 
                   onChange={(e) => setSelectedMarketCategory(e.target.value)}
                   className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   <option value="all">All Categories</option>
                   {marketCategories.map(category => (
                     <option key={category} value={category}>{category}</option>
                   ))}
                 </select>
               </div>
             </div>
           </div>

           <div className="space-y-4">
             {filteredMarketNews.map(item => (
               <div key={item.id} className={`bg-white rounded-lg shadow-sm border-l-4 ${urgencyColors[item.urgency]} p-4`}>
                 <div className="flex items-start space-x-3">
                   <img 
                     src={item.thumbnail} 
                     alt={item.title}
                     className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                     onError={(e) => {
                       e.target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop';
                     }}
                   />
                   <div className="flex-1">
                     <div className="flex items-center space-x-2 mb-2">
                       <span className="text-sm font-medium text-blue-600">{item.company}</span>
                       <span className="text-gray-400">•</span>
                       <span className="text-sm text-gray-500">{item.category}</span>
                     </div>
                     <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                     <p className="text-gray-700 text-sm mb-3">{item.summary}</p>
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-3 text-xs text-gray-500">
                         <span className="flex items-center">
                           <Clock className="w-3 h-3 mr-1" />
                           {item.timestamp}
                         </span>
                         <span>Source: {item.source}</span>
                       </div>
                       <button 
                         onClick={() => item.url && window.open(item.url, '_blank')}
                         className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-xs"
                       >
                         <ExternalLink className="w-3 h-3" />
                         <span>Read More</span>
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             ))}

             {filteredMarketNews.length === 0 && (
               <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                 <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                 <h3 className="text-base font-medium text-gray-900 mb-2">No market news found</h3>
                 <p className="text-gray-600 text-sm">No market updates match your current filters.</p>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};

export default UnionMonitorDashboard;
