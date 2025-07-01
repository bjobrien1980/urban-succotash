import React, { useState, useEffect } from 'react';
import { Search, Bell, TrendingUp, AlertCircle, Users, MapPin, Clock, ExternalLink, RotateCcw } from 'lucide-react';
import UnionPosts from './components/UnionPosts';

const UnionMonitorDashboard = () => {
  const [selectedUnion, setSelectedUnion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // State for market data
  const [marketData, setMarketData] = useState({
    ironOre: {
      price: 118.45,
      changePercent: +2.42,
      source: 'Manual Update'
    },
    companies: [
      { name: 'BHP Group', ticker: 'BHP.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' },
      { name: 'Rio Tinto', ticker: 'RIO.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' },
      { name: 'Fortescue', ticker: 'FMG.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' }
    ],
    economicData: [
      { label: 'CPI', value: '3.4%', change: '+0.2%', trend: 'up', source: 'ABS (Manual)' },
      { label: 'WA Unemp', value: '3.8%', change: '-0.1%', trend: 'down', source: 'ABS (Manual)' },
      { label: 'AUD/USD', value: '0.6785', change: '+0.0045', trend: 'up', source: 'Manual' }
    ]
  });

  // State for news data
  const [unionNews, setUnionNews] = useState([]);
  const [marketNewsData, setMarketNewsData] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Cache configuration
  const CACHE_DURATION = 120 * 60 * 1000; // 120 minutes in milliseconds

  // Cache helper functions - Replace localStorage with in-memory storage for artifacts
  const cache = {};
  
  const getCachedData = (key) => {
    try {
      const cached = cache[key];
      if (!cached) return null;
      
      const { data, timestamp } = cached;
      const now = Date.now();
      
      if (now - timestamp < CACHE_DURATION) {
        console.log(`Using cached ${key} (${Math.round((now - timestamp) / 60000)} minutes old)`);
        return data;
      } else {
        console.log(`Cache expired for ${key} (${Math.round((now - timestamp) / 60000)} minutes old)`);
        delete cache[key];
        return null;
      }
    } catch (error) {
      console.error(`Error reading cache for ${key}:`, error);
      return null;
    }
  };

  const setCachedData = (key, data) => {
    try {
      const cacheEntry = {
        data: data,
        timestamp: Date.now()
      };
      cache[key] = cacheEntry;
      console.log(`Cached ${key} for 120 minutes`);
    } catch (error) {
      console.error(`Error setting cache for ${key}:`, error);
    }
  };

  // Helper functions
  const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const isHighQualityUnionArticle = (article) => {
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const content = title + ' ' + description;
    
    if (!article.title || article.title.length < 10) return false;
    if (!article.description || article.description.length < 20) return false;
    
    const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
    const lowQualitySources = ['reddit', 'twitter', 'facebook', 'youtube', 'tiktok'];
    if (lowQualitySources.some(source => domain.includes(source))) return false;
    
    const irrelevantTerms = ['recipe', 'sport', 'entertainment', 'celebrity', 'fashion', 'game', 'movie'];
    if (irrelevantTerms.some(term => content.includes(term))) return false;
    
    const unionTerms = ['union', 'workers', 'strike', 'industrial', 'cfmeu', 'workplace', 'agreement', 'negotiate', 'safety', 'mining'];
    if (!unionTerms.some(term => content.includes(term))) return false;
    
    return true;
  };

  const isHighQualityMarketArticle = (article) => {
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const content = title + ' ' + description;
    
    if (!article.title || article.title.length < 10) return false;
    if (!article.description || article.description.length < 20) return false;
    
    const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
    const lowQualitySources = ['reddit', 'twitter', 'facebook', 'youtube', 'tiktok'];
    if (lowQualitySources.some(source => domain.includes(source))) return false;
    
    const irrelevantTerms = ['recipe', 'sport', 'entertainment', 'celebrity', 'fashion', 'game', 'movie'];
    if (irrelevantTerms.some(term => content.includes(term))) return false;
    
    const marketTerms = ['iron ore', 'mining', 'bhp', 'rio tinto', 'fortescue', 'price', 'production', 'export', 'demand', 'investment', 'billion', 'expansion'];
    if (!marketTerms.some(term => content.includes(term))) return false;
    
    return true;
  };

  const getUnionPriority = (article) => {
    const content = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
    if (content.includes('strike') || content.includes('safety') || content.includes('dispute')) return 'high';
    if (content.includes('agreement') || content.includes('negotiat') || content.includes('cfmeu')) return 'medium';
    return 'low';
  };

  const getMarketPriority = (article) => {
    const content = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
    if (content.includes('expansion') || content.includes('project') || content.includes('price') || content.includes('production')) return 'high';
    if (content.includes('export') || content.includes('investment') || content.includes('approval')) return 'medium';
    return 'low';
  };

  const calculateUnionRelevance = (article) => {
    let score = 0;
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    
    const highValueTerms = ['cfmeu', 'strike', 'industrial action', 'safety dispute', 'bhp', 'rio tinto', 'fortescue', 'pilbara'];
    const mediumValueTerms = ['union', 'workers', 'agreement', 'negotiate', 'western australia', 'mining'];
    
    highValueTerms.forEach(term => {
      if (title.includes(term)) score += 20;
    });
    
    mediumValueTerms.forEach(term => {
      if (title.includes(term)) score += 10;
    });
    
    highValueTerms.forEach(term => {
      if (description.includes(term)) score += 8;
    });
    
    mediumValueTerms.forEach(term => {
      if (description.includes(term)) score += 4;
    });
    
    const daysSincePublished = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished <= 1) score += 15;
    else if (daysSincePublished <= 3) score += 10;
    else if (daysSincePublished <= 7) score += 5;
    
    const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
    if (domain.includes('.au')) score += 25;
    
    return score;
  };

  const calculateMarketRelevance = (article) => {
    let score = 0;
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    
    const highValueTerms = ['bhp', 'rio tinto', 'fortescue', 'iron ore price', 'pilbara', 'expansion', 'production', 'billion', 'record'];
    const mediumValueTerms = ['mining', 'iron ore', 'western australia', 'export', 'china', 'demand', 'investment'];
    
    highValueTerms.forEach(term => {
      if (title.includes(term)) score += 20;
    });
    
    mediumValueTerms.forEach(term => {
      if (title.includes(term)) score += 10;
    });
    
    highValueTerms.forEach(term => {
      if (description.includes(term)) score += 8;
    });
    
    mediumValueTerms.forEach(term => {
      if (description.includes(term)) score += 4;
    });
    
    const daysSincePublished = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished <= 1) score += 15;
    else if (daysSincePublished <= 3) score += 10;
    else if (daysSincePublished <= 7) score += 5;
    
    const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
    if (domain.includes('.au')) score += 25;
    
    return score;
  };

  const removeDuplicates = (articles) => {
    const seen = new Set();
    const seenTitles = new Set();
    
    return articles.filter(article => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      
      const normalizedTitle = article.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (seenTitles.has(normalizedTitle)) return false;
      seenTitles.add(normalizedTitle);
      
      return true;
    });
  };

  // Enhanced news fetching functions with caching
  const fetchEnhancedUnionNews = async () => {
    console.log('Fetching enhanced union news...');
    
    // Check cache first
    const cachedUnionNews = getCachedData('unionNews');
    if (cachedUnionNews) {
      return cachedUnionNews;
    }
    
    const allUnionNews = [];
    const ENHANCED_UNION_QUERIES = [
      '("CFMEU" OR "Construction Forestry Mining Energy Union") AND ("Western Australia" OR Pilbara) AND (BHP OR "Rio Tinto" OR Fortescue)',
      '("industrial action" OR "work stoppage" OR "safety dispute") AND ("iron ore" OR mining) AND Australia',
      '("enterprise agreement" OR "workplace agreement" OR "pay negotiations") AND mining AND ("Western Australia" OR Pilbara)',
      'Pilbara AND (union OR workers OR strike OR industrial) AND (BHP OR "Rio Tinto" OR Fortescue)',
      '"mining workers" AND "Western Australia" AND (safety OR agreement OR dispute)'
    ];
    
    for (const [index, query] of ENHANCED_UNION_QUERIES.entries()) {
      try {
        console.log(`Trying enhanced union search ${index + 1}: "${query}"`);
        
        const params = new URLSearchParams({
          q: query,
          language: 'en',
          sortBy: 'relevancy',
          pageSize: 8,
          from: getDateDaysAgo(21),
          apiKey: '8c9a0321ff654f6782724d40ad436f1f'
        });

        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://newsapi.org/v2/everything?${params}`)}`;
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        
        if (proxyData.contents) {
          const data = JSON.parse(proxyData.contents);
          console.log(`Enhanced union search "${query}" returned:`, data);
          
          if (data.status === 'ok' && data.articles && data.articles.length > 0) {
            const processedArticles = data.articles
              .filter(article => isHighQualityUnionArticle(article))
              .map(article => ({
                ...article,
                category: 'Union Activity',
                priority: getUnionPriority(article),
                relevanceScore: calculateUnionRelevance(article),
                searchQuery: query,
                enhanced: true
              }));
            
            allUnionNews.push(...processedArticles);
            console.log(`Found ${processedArticles.length} quality articles with query: ${query}`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`Enhanced union search error for query "${query}":`, error);
      }
    }
    
    const uniqueNews = removeDuplicates(allUnionNews);
    const sortedNews = uniqueNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const finalNews = sortedNews.slice(0, 10);
    
    console.log(`Final enhanced union news: ${finalNews.length} articles`);
    setCachedData('unionNews', finalNews);
    
    return finalNews;
  };

  const fetchEnhancedMarketNews = async () => {
    console.log('Fetching enhanced market news...');
    
    const cachedMarketNews = getCachedData('marketNews');
    if (cachedMarketNews) {
      return cachedMarketNews;
    }
    
    const allMarketNews = [];
    const ENHANCED_MARKET_QUERIES = [
      '("iron ore production" OR "mine expansion" OR "new project") AND ("BHP" OR "Rio Tinto" OR "Fortescue") AND Pilbara',
      '("iron ore exports" OR "Port Hedland" OR "Dampier") AND ("BHP" OR "Rio Tinto" OR "Fortescue")',
      '("iron ore price" OR "commodity prices") AND ("China demand" OR "steel production") AND Australia',
      '("mining investment" OR "project approval" OR "billion dollar") AND "Western Australia" AND ("iron ore" OR mining)',
      'Pilbara AND ("BHP" OR "Rio Tinto" OR "Fortescue") AND (expansion OR production OR investment)',
      '"iron ore" AND "Western Australia" AND (BHP OR "Rio Tinto" OR Fortescue) AND (record OR increase OR growth)'
    ];
    
    for (const [index, query] of ENHANCED_MARKET_QUERIES.entries()) {
      try {
        console.log(`Trying enhanced market search ${index + 1}: "${query}"`);
        
        const params = new URLSearchParams({
          q: query,
          language: 'en',
          sortBy: 'relevancy',
          pageSize: 8,
          from: getDateDaysAgo(14),
          apiKey: '8c9a0321ff654f6782724d40ad436f1f'
        });

        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://newsapi.org/v2/everything?${params}`)}`;
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        
        if (proxyData.contents) {
          const data = JSON.parse(proxyData.contents);
          console.log(`Enhanced market search "${query}" returned:`, data);
          
          if (data.status === 'ok' && data.articles && data.articles.length > 0) {
            const processedArticles = data.articles
              .filter(article => isHighQualityMarketArticle(article))
              .map(article => ({
                ...article,
                category: 'Market News',
                priority: getMarketPriority(article),
                relevanceScore: calculateMarketRelevance(article),
                searchQuery: query,
                enhanced: true
              }));
            
            allMarketNews.push(...processedArticles);
            console.log(`Found ${processedArticles.length} quality articles with query: ${query}`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`Enhanced market search error for query "${query}":`, error);
      }
    }
    
    const uniqueNews = removeDuplicates(allMarketNews);
    const sortedNews = uniqueNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const finalNews = sortedNews.slice(0, 15);
    
    console.log(`Final enhanced market news: ${finalNews.length} articles`);
    setCachedData('marketNews', finalNews);
    
    return finalNews;
  };

  // Function to fetch stock data
  const fetchRealData = async () => {
    try {
      console.log('Fetching stock data...');
      const stockSymbols = ['BHP.AX', 'RIO.AX', 'FMG.AX'];
      const stockPromises = stockSymbols.map(async symbol => {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)}`;
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        return JSON.parse(proxyData.contents);
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
            source: 'Yahoo Finance (Live)'
          };
        } catch (error) {
          console.error(`Error processing ${stockSymbols[index]}:`, error);
          return {
            name: ['BHP Group', 'Rio Tinto', 'Fortescue'][index],
            ticker: stockSymbols[index],
            price: 'Error',
            changePercent: '0.00',
            source: 'API Error'
          };
        }
      });

      console.log('Processed companies:', companies);
      
      setMarketData(prev => ({
        ironOre: {
          price: 118.45,
          changePercent: +2.42,
          source: 'Manual Update'
        },
        companies: companies,
        economicData: prev.economicData
      }));

    } catch (error) {
      console.error('Error fetching market data:', error);
      setMarketData(prev => ({
        ...prev,
        companies: prev.companies.map(company => ({
          ...company,
          source: 'API Failed'
        }))
      }));
    }
  };

  // Main news fetching functions
  const fetchUnionNews = async () => {
    try {
      console.log('Checking for cached union news...');
      setNewsLoading(true);
      
      const enhancedNews = await fetchEnhancedUnionNews();
      
      if (enhancedNews && enhancedNews.length > 0) {
        const processedNews = enhancedNews.map((article, index) => ({
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
          url: article.url,
          enhanced: true,
          relevanceScore: article.relevanceScore
        }));
        
        console.log('Loaded enhanced union news from cache/API:', processedNews.length);
        setUnionNews(processedNews);
      } else {
        console.log('No enhanced union articles available');
      }
    } catch (error) {
      console.error('Error fetching enhanced union news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchMarketNews = async () => {
    try {
      console.log('Checking for cached market news...');
      
      const enhancedNews = await fetchEnhancedMarketNews();
      
      if (enhancedNews && enhancedNews.length > 0) {
        const processedNews = enhancedNews.map((article, index) => ({
          id: `market_${index}`,
          company: determineCompany(article.title + ' ' + article.description),
          title: article.title,
          summary: article.description || 'No summary available.',
          timestamp: formatTimestamp(article.publishedAt),
          source: article.source.name,
          category: determineMarketCategory(article.title + ' ' + article.description),
          urgency: determineUrgency(article.title + ' ' + article.description),
          thumbnail: article.urlToImage || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
          url: article.url,
          enhanced: true,
          relevanceScore: article.relevanceScore
        }));
        
        console.log('Loaded enhanced market news from cache/API:', processedNews.length);
        setMarketNewsData(processedNews);
      } else {
        console.log('No enhanced market articles available');
      }
    } catch (error) {
      console.error('Error fetching enhanced market news:', error);
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

  // Load data on component mount
  useEffect(() => {
    fetchRealData();
    fetchUnionNews();
    fetchMarketNews();
  }, []);

  // Mock data as fallback
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

  // Configuration arrays
  const unions = ['Australian Workers Union', 'Western Mine Workers Alliance', 'Australian Manufacturing Workers Union', 'Electrical Trades Union', 'Mining and Energy Union', 'Maritime Union of Australia', 'Offshore Alliance'];
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

// Data filtering
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

  // Refresh function
  const simulateSearch = async () => {
    setIsSearching(true);
    await Promise.all([fetchRealData(), fetchUnionNews(), fetchMarketNews()]);
    setLastUpdated(new Date());
    setIsSearching(false);
  };

  // Statistics
  const todayStats = {
    total: currentUnionData.length,
    high: currentUnionData.filter(item => item.urgency === 'high').length,
    medium: currentUnionData.filter(item => item.urgency === 'medium').length,
    low: currentUnionData.filter(item => item.urgency === 'low').length
  };

import React, { useState, useEffect } from 'react';
import { Search, Bell, TrendingUp, AlertCircle, Users, MapPin, Clock, ExternalLink, RotateCcw } from 'lucide-react';
import UnionPosts from './components/UnionPosts';

const UnionMonitorDashboard = () => {
  const [selectedUnion, setSelectedUnion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // State for market data
  const [marketData, setMarketData] = useState({
    ironOre: {
      price: 118.45,
      changePercent: +2.42,
      source: 'Manual Update'
    },
    companies: [
      { name: 'BHP Group', ticker: 'BHP.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' },
      { name: 'Rio Tinto', ticker: 'RIO.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' },
      { name: 'Fortescue', ticker: 'FMG.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' }
    ],
    economicData: [
      { label: 'CPI', value: '3.4%', change: '+0.2%', trend: 'up', source: 'ABS (Manual)' },
      { label: 'WA Unemp', value: '3.8%', change: '-0.1%', trend: 'down', source: 'ABS (Manual)' },
      { label: 'AUD/USD', value: '0.6785', change: '+0.0045', trend: 'up', source: 'Manual' }
    ]
  });

  // State for news data
  const [unionNews, setUnionNews] = useState([]);
  const [marketNewsData, setMarketNewsData] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Cache configuration
  const CACHE_DURATION = 120 * 60 * 1000; // 120 minutes in milliseconds

  // Cache helper functions - Replace localStorage with in-memory storage for artifacts
  const cache = {};
  
  const getCachedData = (key) => {
    try {
      const cached = cache[key];
      if (!cached) return null;
      
      const { data, timestamp } = cached;
      const now = Date.now();
      
      if (now - timestamp < CACHE_DURATION) {
        console.log(`Using cached ${key} (${Math.round((now - timestamp) / 60000)} minutes old)`);
        return data;
      } else {
        console.log(`Cache expired for ${key} (${Math.round((now - timestamp) / 60000)} minutes old)`);
        delete cache[key];
        return null;
      }
    } catch (error) {
      console.error(`Error reading cache for ${key}:`, error);
      return null;
    }
  };

  const setCachedData = (key, data) => {
    try {
      const cacheEntry = {
        data: data,
        timestamp: Date.now()
      };
      cache[key] = cacheEntry;
      console.log(`Cached ${key} for 120 minutes`);
    } catch (error) {
      console.error(`Error setting cache for ${key}:`, error);
    }
  };

  // Helper functions
  const getDateDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const isHighQualityUnionArticle = (article) => {
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const content = title + ' ' + description;
    
    if (!article.title || article.title.length < 10) return false;
    if (!article.description || article.description.length < 20) return false;
    
    const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
    const lowQualitySources = ['reddit', 'twitter', 'facebook', 'youtube', 'tiktok'];
    if (lowQualitySources.some(source => domain.includes(source))) return false;
    
    const irrelevantTerms = ['recipe', 'sport', 'entertainment', 'celebrity', 'fashion', 'game', 'movie'];
    if (irrelevantTerms.some(term => content.includes(term))) return false;
    
    const unionTerms = ['union', 'workers', 'strike', 'industrial', 'cfmeu', 'workplace', 'agreement', 'negotiate', 'safety', 'mining'];
    if (!unionTerms.some(term => content.includes(term))) return false;
    
    return true;
  };

  const isHighQualityMarketArticle = (article) => {
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const content = title + ' ' + description;
    
    if (!article.title || article.title.length < 10) return false;
    if (!article.description || article.description.length < 20) return false;
    
    const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
    const lowQualitySources = ['reddit', 'twitter', 'facebook', 'youtube', 'tiktok'];
    if (lowQualitySources.some(source => domain.includes(source))) return false;
    
    const irrelevantTerms = ['recipe', 'sport', 'entertainment', 'celebrity', 'fashion', 'game', 'movie'];
    if (irrelevantTerms.some(term => content.includes(term))) return false;
    
    const marketTerms = ['iron ore', 'mining', 'bhp', 'rio tinto', 'fortescue', 'price', 'production', 'export', 'demand', 'investment', 'billion', 'expansion'];
    if (!marketTerms.some(term => content.includes(term))) return false;
    
    return true;
  };

  const getUnionPriority = (article) => {
    const content = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
    if (content.includes('strike') || content.includes('safety') || content.includes('dispute')) return 'high';
    if (content.includes('agreement') || content.includes('negotiat') || content.includes('cfmeu')) return 'medium';
    return 'low';
  };

  const getMarketPriority = (article) => {
    const content = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
    if (content.includes('expansion') || content.includes('project') || content.includes('price') || content.includes('production')) return 'high';
    if (content.includes('export') || content.includes('investment') || content.includes('approval')) return 'medium';
    return 'low';
  };

  const calculateUnionRelevance = (article) => {
    let score = 0;
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    
    const highValueTerms = ['cfmeu', 'strike', 'industrial action', 'safety dispute', 'bhp', 'rio tinto', 'fortescue', 'pilbara'];
    const mediumValueTerms = ['union', 'workers', 'agreement', 'negotiate', 'western australia', 'mining'];
    
    highValueTerms.forEach(term => {
      if (title.includes(term)) score += 20;
    });
    
    mediumValueTerms.forEach(term => {
      if (title.includes(term)) score += 10;
    });
    
    highValueTerms.forEach(term => {
      if (description.includes(term)) score += 8;
    });
    
    mediumValueTerms.forEach(term => {
      if (description.includes(term)) score += 4;
    });
    
    const daysSincePublished = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished <= 1) score += 15;
    else if (daysSincePublished <= 3) score += 10;
    else if (daysSincePublished <= 7) score += 5;
    
    const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
    if (domain.includes('.au')) score += 25;
    
    return score;
  };

  const calculateMarketRelevance = (article) => {
    let score = 0;
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    
    const highValueTerms = ['bhp', 'rio tinto', 'fortescue', 'iron ore price', 'pilbara', 'expansion', 'production', 'billion', 'record'];
    const mediumValueTerms = ['mining', 'iron ore', 'western australia', 'export', 'china', 'demand', 'investment'];
    
    highValueTerms.forEach(term => {
      if (title.includes(term)) score += 20;
    });
    
    mediumValueTerms.forEach(term => {
      if (title.includes(term)) score += 10;
    });
    
    highValueTerms.forEach(term => {
      if (description.includes(term)) score += 8;
    });
    
    mediumValueTerms.forEach(term => {
      if (description.includes(term)) score += 4;
    });
    
    const daysSincePublished = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished <= 1) score += 15;
    else if (daysSincePublished <= 3) score += 10;
    else if (daysSincePublished <= 7) score += 5;
    
    const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
    if (domain.includes('.au')) score += 25;
    
    return score;
  };

  const removeDuplicates = (articles) => {
    const seen = new Set();
    const seenTitles = new Set();
    
    return articles.filter(article => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      
      const normalizedTitle = article.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (seenTitles.has(normalizedTitle)) return false;
      seenTitles.add(normalizedTitle);
      
      return true;
    });
  };

  // Enhanced news fetching functions with caching
  const fetchEnhancedUnionNews = async () => {
    console.log('Fetching enhanced union news...');
    
    // Check cache first
    const cachedUnionNews = getCachedData('unionNews');
    if (cachedUnionNews) {
      return cachedUnionNews;
    }
    
    const allUnionNews = [];
    const ENHANCED_UNION_QUERIES = [
      '("CFMEU" OR "Construction Forestry Mining Energy Union") AND ("Western Australia" OR Pilbara) AND (BHP OR "Rio Tinto" OR Fortescue)',
      '("industrial action" OR "work stoppage" OR "safety dispute") AND ("iron ore" OR mining) AND Australia',
      '("enterprise agreement" OR "workplace agreement" OR "pay negotiations") AND mining AND ("Western Australia" OR Pilbara)',
      'Pilbara AND (union OR workers OR strike OR industrial) AND (BHP OR "Rio Tinto" OR Fortescue)',
      '"mining workers" AND "Western Australia" AND (safety OR agreement OR dispute)'
    ];
    
    for (const [index, query] of ENHANCED_UNION_QUERIES.entries()) {
      try {
        console.log(`Trying enhanced union search ${index + 1}: "${query}"`);
        
        const params = new URLSearchParams({
          q: query,
          language: 'en',
          sortBy: 'relevancy',
          pageSize: 8,
          from: getDateDaysAgo(21),
          apiKey: '8c9a0321ff654f6782724d40ad436f1f'
        });

        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://newsapi.org/v2/everything?${params}`)}`;
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        
        if (proxyData.contents) {
          const data = JSON.parse(proxyData.contents);
          console.log(`Enhanced union search "${query}" returned:`, data);
          
          if (data.status === 'ok' && data.articles && data.articles.length > 0) {
            const processedArticles = data.articles
              .filter(article => isHighQualityUnionArticle(article))
              .map(article => ({
                ...article,
                category: 'Union Activity',
                priority: getUnionPriority(article),
                relevanceScore: calculateUnionRelevance(article),
                searchQuery: query,
                enhanced: true
              }));
            
            allUnionNews.push(...processedArticles);
            console.log(`Found ${processedArticles.length} quality articles with query: ${query}`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`Enhanced union search error for query "${query}":`, error);
      }
    }
    
    const uniqueNews = removeDuplicates(allUnionNews);
    const sortedNews = uniqueNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const finalNews = sortedNews.slice(0, 10);
    
    console.log(`Final enhanced union news: ${finalNews.length} articles`);
    setCachedData('unionNews', finalNews);
    
    return finalNews;
  };

  const fetchEnhancedMarketNews = async () => {
    console.log('Fetching enhanced market news...');
    
    const cachedMarketNews = getCachedData('marketNews');
    if (cachedMarketNews) {
      return cachedMarketNews;
    }
    
    const allMarketNews = [];
    const ENHANCED_MARKET_QUERIES = [
      '("iron ore production" OR "mine expansion" OR "new project") AND ("BHP" OR "Rio Tinto" OR "Fortescue") AND Pilbara',
      '("iron ore exports" OR "Port Hedland" OR "Dampier") AND ("BHP" OR "Rio Tinto" OR "Fortescue")',
      '("iron ore price" OR "commodity prices") AND ("China demand" OR "steel production") AND Australia',
      '("mining investment" OR "project approval" OR "billion dollar") AND "Western Australia" AND ("iron ore" OR mining)',
      'Pilbara AND ("BHP" OR "Rio Tinto" OR "Fortescue") AND (expansion OR production OR investment)',
      '"iron ore" AND "Western Australia" AND (BHP OR "Rio Tinto" OR Fortescue) AND (record OR increase OR growth)'
    ];
    
    for (const [index, query] of ENHANCED_MARKET_QUERIES.entries()) {
      try {
        console.log(`Trying enhanced market search ${index + 1}: "${query}"`);
        
        const params = new URLSearchParams({
          q: query,
          language: 'en',
          sortBy: 'relevancy',
          pageSize: 8,
          from: getDateDaysAgo(14),
          apiKey: '8c9a0321ff654f6782724d40ad436f1f'
        });

        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://newsapi.org/v2/everything?${params}`)}`;
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        
        if (proxyData.contents) {
          const data = JSON.parse(proxyData.contents);
          console.log(`Enhanced market search "${query}" returned:`, data);
          
          if (data.status === 'ok' && data.articles && data.articles.length > 0) {
            const processedArticles = data.articles
              .filter(article => isHighQualityMarketArticle(article))
              .map(article => ({
                ...article,
                category: 'Market News',
                priority: getMarketPriority(article),
                relevanceScore: calculateMarketRelevance(article),
                searchQuery: query,
                enhanced: true
              }));
            
            allMarketNews.push(...processedArticles);
            console.log(`Found ${processedArticles.length} quality articles with query: ${query}`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`Enhanced market search error for query "${query}":`, error);
      }
    }
    
    const uniqueNews = removeDuplicates(allMarketNews);
    const sortedNews = uniqueNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const finalNews = sortedNews.slice(0, 15);
    
    console.log(`Final enhanced market news: ${finalNews.length} articles`);
    setCachedData('marketNews', finalNews);
    
    return finalNews;
  };

  // Function to fetch stock data
  const fetchRealData = async () => {
    try {
      console.log('Fetching stock data...');
      const stockSymbols = ['BHP.AX', 'RIO.AX', 'FMG.AX'];
      const stockPromises = stockSymbols.map(async symbol => {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)}`;
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        return JSON.parse(proxyData.contents);
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
            source: 'Yahoo Finance (Live)'
          };
        } catch (error) {
          console.error(`Error processing ${stockSymbols[index]}:`, error);
          return {
            name: ['BHP Group', 'Rio Tinto', 'Fortescue'][index],
            ticker: stockSymbols[index],
            price: 'Error',
            changePercent: '0.00',
            source: 'API Error'
          };
        }
      });

      console.log('Processed companies:', companies);
      
      setMarketData(prev => ({
        ironOre: {
          price: 118.45,
          changePercent: +2.42,
          source: 'Manual Update'
        },
        companies: companies,
        economicData: prev.economicData
      }));

    } catch (error) {
      console.error('Error fetching market data:', error);
      setMarketData(prev => ({
        ...prev,
        companies: prev.companies.map(company => ({
          ...company,
          source: 'API Failed'
        }))
      }));
    }
  };

  // Main news fetching functions
  const fetchUnionNews = async () => {
    try {
      console.log('Checking for cached union news...');
      setNewsLoading(true);
      
      const enhancedNews = await fetchEnhancedUnionNews();
      
      if (enhancedNews && enhancedNews.length > 0) {
        const processedNews = enhancedNews.map((article, index) => ({
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
          url: article.url,
          enhanced: true,
          relevanceScore: article.relevanceScore
        }));
        
        console.log('Loaded enhanced union news from cache/API:', processedNews.length);
        setUnionNews(processedNews);
      } else {
        console.log('No enhanced union articles available');
      }
    } catch (error) {
      console.error('Error fetching enhanced union news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchMarketNews = async () => {
    try {
      console.log('Checking for cached market news...');
      
      const enhancedNews = await fetchEnhancedMarketNews();
      
      if (enhancedNews && enhancedNews.length > 0) {
        const processedNews = enhancedNews.map((article, index) => ({
          id: `market_${index}`,
          company: determineCompany(article.title + ' ' + article.description),
          title: article.title,
          summary: article.description || 'No summary available.',
          timestamp: formatTimestamp(article.publishedAt),
          source: article.source.name,
          category: determineMarketCategory(article.title + ' ' + article.description),
          urgency: determineUrgency(article.title + ' ' + article.description),
          thumbnail: article.urlToImage || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
          url: article.url,
          enhanced: true,
          relevanceScore: article.relevanceScore
        }));
        
        console.log('Loaded enhanced market news from cache/API:', processedNews.length);
        setMarketNewsData(processedNews);
      } else {
        console.log('No enhanced market articles available');
      }
    } catch (error) {
      console.error('Error fetching enhanced market news:', error);
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

  // Load data on component mount
  useEffect(() => {
    fetchRealData();
    fetchUnionNews();
    fetchMarketNews();
  }, []);

  // Mock data as fallback
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

  // Configuration arrays
  const unions = ['Australian Workers Union', 'Western Mine Workers Alliance', 'Australian Manufacturing Workers Union', 'Electrical Trades Union', 'Mining and Energy Union', 'Maritime Union of Australia', 'Offshore Alliance'];
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

  // Data filtering
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

  // Refresh function
  const simulateSearch = async () => {
    setIsSearching(true);
    await Promise.all([fetchRealData(), fetchUnionNews(), fetchMarketNews()]);
    setLastUpdated(new Date());
    setIsSearching(false);
  };

  // Statistics
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Column 1: Iron Ore Price */}
              <div className="text-center lg:text-left">
                <div className="border-b border-gray-200 pb-4 lg:border-b-0 lg:border-r lg:border-gray-200 lg:pr-8 lg:pb-0">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Iron Ore Price</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col items-center lg:items-start">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-gray-900">${marketData.ironOre.price}</span>
                        <span className="text-sm text-gray-600 font-medium">/tonne CFR</span>
                      </div>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium mt-2 ${
                        marketData.ironOre.changePercent >= 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <span className="mr-1">
                          {marketData.ironOre.changePercent >= 0 ? '↗' : '↘'}
                        </span>
                        {marketData.ironOre.changePercent >= 0 ? '+' : ''}{marketData.ironOre.changePercent}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      Source: {marketData.ironOre.source}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Major Miners */}
              <div className="text-center lg:text-left">
                <div className="border-b border-gray-200 pb-4 lg:border-b-0 lg:border-r lg:border-gray-200 lg:pr-8 lg:pb-0">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Major Miners (ASX)</h3>
                  <div className="space-y-3">
                    {marketData.companies.map((company, index) => (
                      <div key={index} className="flex justify-between items-center lg:justify-start lg:space-x-4">
                        <div className="flex-1 lg:flex-none">
                          <div className="text-sm font-semibold text-gray-900">{company.name}</div>
                          <div className="text-xs text-gray-500">{company.ticker}</div>
                        </div>
                        <div className="text-right lg:text-left lg:flex-1">
                          <div className="text-lg font-bold text-gray-900">${company.price}</div>
                          <div className={`text-xs font-medium ${
                            parseFloat(company.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {parseFloat(company.changePercent) >= 0 ? '+' : ''}{company.changePercent}%
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      Source: Yahoo Finance (Live)
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Key Indicators */}
              <div className="text-center lg:text-left">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Key Indicators</h3>
                  <div className="space-y-3">
                    {marketData.economicData.slice(0, 3).map((indicator, index) => (
                      <div key={index} className="flex justify-between items-center lg:justify-start lg:space-x-4">
                        <div className="flex-1 lg:flex-none">
                          <div className="text-sm font-semibold text-gray-900">{indicator.label}</div>
                          <div className="text-xs text-gray-500">Economic Indicator</div>
                        </div>
                        <div className="text-right lg:text-left lg:flex-1">
                          <div className="text-lg font-bold text-gray-900">{indicator.value}</div>
                          <div className={`text-xs font-medium ${
                            indicator.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {indicator.trend === 'up' ? '↗' : '↘'} {indicator.change}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      Source: ABS (Manual)
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>

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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Company</label>
              <select 
                value={selectedCompany} 
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Companies</option>
                {companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Market Category</label>
              <select 
                value={selectedMarketCategory} 
                onChange={(e) => setSelectedMarketCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Market Categories</option>
                {marketCategories.map(category => (
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

        {/* News Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Union Activity Feed */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Union Activity Feed 
              {unionNews.length > 0 && <span className="text-sm text-green-600 ml-2">● Live ({unionNews.length})</span>}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Market Watch - WA Iron Ore Miners
              {marketNewsData.length > 0 && <span className="text-sm text-green-600 ml-2">● Live ({marketNewsData.length})</span>}
            </h2>

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
