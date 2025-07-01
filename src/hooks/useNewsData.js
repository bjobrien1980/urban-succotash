import { useState, useCallback } from 'react';

// Cache outside the hook so it persists across re-renders
const cache = {};
const CACHE_DURATION = 120 * 60 * 1000; // 120 minutes

export const useNewsData = () => {
  const [unionNews, setUnionNews] = useState([]);
  const [marketNewsData, setMarketNewsData] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Cache helper functions
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

  // News categorization helpers
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

  // Enhanced news fetching functions
  const fetchEnhancedUnionNews = async () => {
    console.log('Fetching enhanced union news...');
    
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

  // Main fetch functions
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

  // Main refresh function
  const refreshNews = useCallback(async () => {
    setIsSearching(true);
    await Promise.all([fetchUnionNews(), fetchMarketNews()]);
    setIsSearching(false);
  }, []);

  return {
    unionNews,
    marketNewsData,
    newsLoading,
    isSearching,
    refreshNews
  };
};
