// Enhanced NewsAPI implementation for Pilbara Watch
// Replace your existing news fetching functions with these

const NEWS_API_KEY = '8c9a0321ff654f6782724d40ad436f1f';
const BASE_URL = 'https://newsapi.org/v2/everything';

// Enhanced search queries - much more targeted than your current ones
const ENHANCED_QUERIES = {
  union: [
    // More specific union queries that get better results
    '("CFMEU" OR "Construction Forestry Mining Energy Union") AND ("Western Australia" OR Pilbara) AND (BHP OR "Rio Tinto" OR Fortescue)',
    '("industrial action" OR "work stoppage" OR "safety dispute") AND ("iron ore" OR mining) AND Australia',
    '("enterprise agreement" OR "workplace agreement" OR "pay negotiations") AND mining AND ("Western Australia" OR Pilbara)',
    '("mine safety" OR "workplace safety") AND union AND ("BHP" OR "Rio Tinto" OR "Fortescue")'
  ],
  
  market: [
    // More targeted market queries
    '("iron ore production" OR "mine expansion" OR "new project") AND ("BHP" OR "Rio Tinto" OR "Fortescue") AND Pilbara',
    '("iron ore exports" OR "Port Hedland" OR "Dampier") AND ("BHP" OR "Rio Tinto" OR "Fortescue")',
    '("iron ore price" OR "commodity prices") AND ("China demand" OR "steel production") AND Australia',
    '("mining investment" OR "project approval") AND "Western Australia" AND ("iron ore" OR mining)'
  ]
};

// Enhanced union news fetcher - replaces your current fetchUnionNews
export async function fetchEnhancedUnionNews() {
  console.log('Fetching enhanced union news...');
  const allUnionNews = [];
  
  for (const [index, query] of ENHANCED_QUERIES.union.entries()) {
    try {
      console.log(`Trying enhanced union search ${index + 1}: "${query}"`);
      
      const params = new URLSearchParams({
        q: query,
        language: 'en',
        sortBy: 'relevancy', // Changed from publishedAt for better quality
        pageSize: 8, // Slightly smaller to get higher quality
        from: getDateDaysAgo(21), // 3 weeks instead of 2 for more content
        apiKey: NEWS_API_KEY
      });

      const response = await fetch(`${BASE_URL}?${params}`);
      const data = await response.json();
      
      if (data.status === 'ok' && data.articles && data.articles.length > 0) {
        console.log(`Enhanced union search found ${data.totalResults} articles with query: ${query}`);
        
        // Filter and enhance articles
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
      }
      
      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`Enhanced union search error for query "${query}":`, error);
    }
  }
  
  // Remove duplicates and sort by relevance
  const uniqueNews = removeDuplicates(allUnionNews);
  const sortedNews = uniqueNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  console.log(`Final enhanced union news: ${sortedNews.length} articles`);
  return sortedNews.slice(0, 10); // Return top 10 most relevant
}

// Enhanced market news fetcher - replaces your current fetchMarketNews  
export async function fetchEnhancedMarketNews() {
  console.log('Fetching enhanced market news...');
  const allMarketNews = [];
  
  for (const [index, query] of ENHANCED_QUERIES.market.entries()) {
    try {
      console.log(`Trying enhanced market search ${index + 1}: "${query}"`);
      
      const params = new URLSearchParams({
        q: query,
        language: 'en',
        sortBy: 'relevancy',
        pageSize: 10,
        from: getDateDaysAgo(14), // 2 weeks for market news (more time-sensitive)
        apiKey: NEWS_API_KEY
      });

      const response = await fetch(`${BASE_URL}?${params}`);
      const data = await response.json();
      
      if (data.status === 'ok' && data.articles && data.articles.length > 0) {
        console.log(`Enhanced market search found ${data.totalResults} articles with query: ${query}`);
        
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
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`Enhanced market search error for query "${query}":`, error);
    }
  }
  
  const uniqueNews = removeDuplicates(allMarketNews);
  const sortedNews = uniqueNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  console.log(`Final enhanced market news: ${sortedNews.length} articles`);
  return sortedNews.slice(0, 15); // Return top 15 most relevant
}

// Quality filters for union articles
function isHighQualityUnionArticle(article) {
  const title = (article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  const content = title + ' ' + description;
  
  // Must have basic quality
  if (!article.title || article.title.length < 10) return false;
  if (!article.description || article.description.length < 20) return false;
  
  // Exclude low-quality sources
  const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
  const lowQualitySources = ['reddit', 'twitter', 'facebook', 'youtube', 'tiktok'];
  if (lowQualitySources.some(source => domain.includes(source))) return false;
  
  // Exclude irrelevant content
  const irrelevantTerms = ['recipe', 'sport', 'entertainment', 'celebrity', 'fashion'];
  if (irrelevantTerms.some(term => content.includes(term))) return false;
  
  // Must be union or workplace related
  const unionTerms = ['union', 'workers', 'strike', 'industrial', 'cfmeu', 'workplace', 'agreement', 'negotiate', 'safety'];
  if (!unionTerms.some(term => content.includes(term))) return false;
  
  return true;
}

// Quality filters for market articles
function isHighQualityMarketArticle(article) {
  const title = (article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  const content = title + ' ' + description;
  
  if (!article.title || article.title.length < 10) return false;
  if (!article.description || article.description.length < 20) return false;
  
  const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
  const lowQualitySources = ['reddit', 'twitter', 'facebook', 'youtube', 'tiktok'];
  if (lowQualitySources.some(source => domain.includes(source))) return false;
  
  const irrelevantTerms = ['recipe', 'sport', 'entertainment', 'celebrity', 'fashion'];
  if (irrelevantTerms.some(term => content.includes(term))) return false;
  
  // Must be market/business related
  const marketTerms = ['iron ore', 'mining', 'bhp', 'rio tinto', 'fortescue', 'price', 'production', 'export', 'demand', 'investment'];
  if (!marketTerms.some(term => content.includes(term))) return false;
  
  return true;
}

// Priority scoring for union news
function getUnionPriority(article) {
  const content = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
  
  // High priority: strikes, safety issues, major disputes
  if (content.includes('strike') || content.includes('safety') || content.includes('dispute')) {
    return 'high';
  }
  
  // Medium priority: negotiations, agreements
  if (content.includes('agreement') || content.includes('negotiat') || content.includes('cfmeu')) {
    return 'medium';
  }
  
  return 'low';
}

// Priority scoring for market news
function getMarketPriority(article) {
  const content = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
  
  // High priority: major company news, price changes, production updates
  if (content.includes('expansion') || content.includes('project') || content.includes('price') || content.includes('production')) {
    return 'high';
  }
  
  // Medium priority: export news, general business
  if (content.includes('export') || content.includes('investment') || content.includes('approval')) {
    return 'medium';
  }
  
  return 'low';
}

// Enhanced relevance scoring for union news
function calculateUnionRelevance(article) {
  let score = 0;
  const title = (article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  
  // High value union terms
  const highValueTerms = ['cfmeu', 'strike', 'industrial action', 'safety dispute', 'bhp', 'rio tinto', 'fortescue'];
  const mediumValueTerms = ['union', 'workers', 'agreement', 'negotiate', 'pilbara', 'western australia'];
  
  // Score title mentions (higher weight)
  highValueTerms.forEach(term => {
    if (title.includes(term)) score += 20;
  });
  
  mediumValueTerms.forEach(term => {
    if (title.includes(term)) score += 10;
  });
  
  // Score description mentions
  highValueTerms.forEach(term => {
    if (description.includes(term)) score += 8;
  });
  
  mediumValueTerms.forEach(term => {
    if (description.includes(term)) score += 4;
  });
  
  // Recency bonus
  const daysSincePublished = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublished <= 1) score += 15;
  else if (daysSincePublished <= 3) score += 10;
  else if (daysSincePublished <= 7) score += 5;
  
  // Australian source bonus
  const domain = article.url ? new URL(article.url).hostname.toLowerCase() : '';
  if (domain.includes('.au')) score += 25;
  
  return score;
}

// Enhanced relevance scoring for market news
function calculateMarketRelevance(article) {
  let score = 0;
  const title = (article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  
  const highValueTerms = ['bhp', 'rio tinto', 'fortescue', 'iron ore price', 'pilbara', 'expansion', 'production'];
  const mediumValueTerms = ['mining', 'iron ore', 'western australia', 'export', 'china', 'demand'];
  
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
}

// Remove duplicates by title similarity
function removeDuplicates(articles) {
  const seen = new Set();
  return articles.filter(article => {
    const normalizedTitle = article.title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (seen.has(normalizedTitle)) {
      return false;
    }
    seen.add(normalizedTitle);
    return true;
  });
}

// Helper function for date calculation
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// Combined enhanced news fetcher to replace your main news function
export async function fetchAllEnhancedNews() {
  console.log('Starting enhanced news fetch...');
  
  try {
    // Fetch both types concurrently but with slight delay
    const unionNewsPromise = fetchEnhancedUnionNews();
    
    // Small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const marketNewsPromise = fetchEnhancedMarketNews();
    
    const [unionNews, marketNews] = await Promise.all([unionNewsPromise, marketNewsPromise]);
    
    return {
      unionNews: unionNews || [],
      marketNews: marketNews || [],
      timestamp: new Date().toISOString(),
      enhanced: true
    };
    
  } catch (error) {
    console.error('Error fetching enhanced news:', error);
    return {
      unionNews: [],
      marketNews: [],
      error: error.message
    };
  }
}

// Export individual functions for flexibility
export { 
  ENHANCED_QUERIES,
  isHighQualityUnionArticle,
  isHighQualityMarketArticle,
  calculateUnionRelevance,
  calculateMarketRelevance
};
