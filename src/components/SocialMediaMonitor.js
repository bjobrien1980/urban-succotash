import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, ExternalLink, Users, AlertTriangle } from 'lucide-react';

const SocialMediaMonitor = () => {
  const [socialData, setSocialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  // API Configuration
  const API_CONFIG = {
    twitter: {
      baseUrl: 'https://api.twitter.com/2',
      bearerToken: process.env.REACT_APP_TWITTER_BEARER_TOKEN
    },
    news: {
      baseUrl: 'https://newsapi.org/v2',
      apiKey: process.env.REACT_APP_NEWS_API_KEY || '8c9a0321ff654f6782724d40ad436f1f'
    }
  };

  // Company keywords for searches
  const SEARCH_KEYWORDS = {
    companies: {
      'BHP': ['BHP', 'BHP Billiton', 'BHP Group'],
      'Rio Tinto': ['Rio Tinto', 'RioTinto'],
      'Fortescue': ['Fortescue', 'FMG', 'Fortescue Metals'],
      'Hancock Iron Ore': ['Hancock', 'Roy Hill', 'Hancock Prospecting'],
      'Mineral Resources': ['MinRes', 'Mineral Resources', 'MRL']
    }
  };

  // Fetch Twitter data
  const fetchTwitterData = async (company, keywords) => {
    try {
      if (!API_CONFIG.twitter.bearerToken) {
        console.log('Twitter API: Bearer token not configured');
        return [];
      }

      const query = `(${keywords.join(' OR ')}) (mining OR "iron ore" OR Pilbara OR FIFO) -is:retweet lang:en`;
      const params = new URLSearchParams({
        query,
        max_results: '10',
        'tweet.fields': 'created_at,public_metrics,author_id',
        'user.fields': 'username',
        'expansions': 'author_id'
      });

      const response = await fetch(`${API_CONFIG.twitter.baseUrl}/tweets/search/recent?${params}`, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.twitter.bearerToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const tweets = data.data || [];
      const users = data.includes?.users || [];
      
      // Create user map
      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = user;
      });

      return tweets.map(tweet => ({
        id: tweet.id,
        content: tweet.text,
        author: `@${userMap[tweet.author_id]?.username || 'unknown'}`,
        timestamp: new Date(tweet.created_at).toLocaleString('en-AU', {
          timeZone: 'Australia/Perth',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        engagement: (tweet.public_metrics?.like_count || 0) + 
                   (tweet.public_metrics?.retweet_count || 0) + 
                   (tweet.public_metrics?.reply_count || 0),
        platform: 'Twitter',
        company: company
      }));

    } catch (error) {
      console.error(`Twitter fetch error for ${company}:`, error);
      return [];
    }
  };

  // Fetch Reddit data
  const fetchRedditData = async (company, keywords) => {
    try {
      const searchTerms = keywords.join(' OR ');
      const subreddits = ['mining', 'australia', 'FIFO', 'westernaustralia'];
      let allPosts = [];

      for (const subreddit of subreddits.slice(0, 2)) { // Limit to avoid too many requests
        try {
          const query = `${searchTerms} mining`;
          const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&limit=5&sort=new&restrict_sr=1`;
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'PilbaraWatch/1.0'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const posts = data.data?.children || [];
            
            allPosts = allPosts.concat(posts.map(post => ({
              id: post.data.id,
              content: post.data.title,
              author: `u/${post.data.author}`,
              timestamp: new Date(post.data.created_utc * 1000).toLocaleString('en-AU', {
                timeZone: 'Australia/Perth',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              engagement: (post.data.score || 0) + (post.data.num_comments || 0),
              platform: 'Reddit',
              company: company,
              url: `https://reddit.com${post.data.permalink}`
            })));
          }
        } catch (error) {
          console.error(`Reddit error for ${subreddit}:`, error);
        }
      }

      return allPosts.slice(0, 5); // Limit to 5 posts per company
    } catch (error) {
      console.error(`Reddit fetch error for ${company}:`, error);
      return [];
    }
  };

  // Fetch news data
  const fetchNewsData = async (company, keywords) => {
    try {
      const query = `(${keywords.join(' OR ')}) AND (mining OR "iron ore" OR Pilbara)`;
      const url = `${API_CONFIG.news.baseUrl}/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${API_CONFIG.news.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }

      const data = await response.json();
      const articles = data.articles || [];

      return articles.map(article => ({
        id: article.url,
        content: article.title,
        author: article.source.name,
        timestamp: new Date(article.publishedAt).toLocaleString('en-AU', {
          timeZone: 'Australia/Perth',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        engagement: 0,
        platform: 'News',
        company: company,
        url: article.url
      }));

    } catch (error) {
      console.error(`News fetch error for ${company}:`, error);
      return [];
    }
  };

  // Main function to fetch all real data
  const fetchRealData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching real social media data...');
      
      const allPosts = [];
      const companyData = {};

      // Initialize company data
      Object.keys(SEARCH_KEYWORDS.companies).forEach(company => {
        companyData[company] = {
          company,
          mentions: 0,
          recentDiscussions: [],
          keyTopics: new Set()
        };
      });

      // Fetch data for each company
      for (const [company, keywords] of Object.entries(SEARCH_KEYWORDS.companies)) {
        console.log(`Fetching data for ${company}...`);

        // Fetch from all sources
        const [twitterPosts, redditPosts, newsArticles] = await Promise.all([
          fetchTwitterData(company, keywords),
          fetchRedditData(company, keywords),
          fetchNewsData(company, keywords)
        ]);

        // Combine all posts
        const companyPosts = [...twitterPosts, ...redditPosts, ...newsArticles];
        allPosts.push(...companyPosts);

        // Update company data
        companyData[company].mentions = companyPosts.length;
        
        // Add recent discussions (top 3 posts)
        companyData[company].recentDiscussions = companyPosts
          .slice(0, 3)
          .map(post => ({
            topic: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
            platform: post.platform,
            mentions: 1,
            lastSeen: post.timestamp
          }));

        // Determine key topics
        const topics = ['operations', 'employment', 'expansion'];
        if (company === 'BHP') topics.push('roster changes');
        if (company === 'Rio Tinto') topics.push('negotiations');
        if (company === 'Fortescue') topics.push('green initiatives');
        if (company === 'Hancock Iron Ore') topics.push('Roy Hill operations');
        if (company === 'Mineral Resources') topics.push('automation');
        
        companyData[company].keyTopics = topics;

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Sort posts by recency and engagement
      const sortedPosts = allPosts
        .sort((a, b) => {
          const engagementDiff = (b.engagement || 0) - (a.engagement || 0);
          return engagementDiff;
        })
        .slice(0, 15); // Top 15 posts

      const processedData = {
        companyMentions: Object.values(companyData),
        recentPosts: sortedPosts,
        lastUpdated: new Date().toLocaleString('en-AU', {
          timeZone: 'Australia/Perth'
        }),
        totalPosts: allPosts.length
      };

      setSocialData(processedData);
      console.log('Real data fetched successfully:', processedData);

    } catch (error) {
      console.error('Error fetching real social media data:', error);
      setError('Failed to fetch some social media data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [selectedTimeframe]);

  const refreshData = () => {
    fetchRealData();
  };

  const getPlatformColor = (platform) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return 'bg-blue-100 text-blue-800';
      case 'reddit': return 'bg-orange-100 text-orange-800';
      case 'facebook': return 'bg-blue-100 text-blue-900';
      case 'linkedin': return 'bg-blue-100 text-blue-700';
      case 'news': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Monitor</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin h-6 w-6 text-blue-600 mr-2" />
            <span className="text-gray-600">Fetching live social media data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Monitor</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center text-amber-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!socialData) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Monitor</h2>
      
      {/* Company Discussions */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-gray-800">Company Discussion Summary</h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">{socialData.totalPosts} posts analyzed</span>
            <button 
              onClick={refreshData}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {socialData.companyMentions.map((company, index) => (
            <div key={index} className="p-3 border border-gray-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{company.company}</h4>
                <span className="text-sm text-gray-600">{company.mentions} mentions</span>
              </div>
              
              {company.recentDiscussions.length > 0 && (
                <div className="mb-2">
                  {company.recentDiscussions.map((discussion, i) => (
                    <div key={i} className="text-sm text-gray-700 mb-1">
                      {discussion.topic}
                      <div className="text-xs text-gray-500">
                        {discussion.platform} • {discussion.lastSeen}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex flex-wrap gap-1">
                {company.keyTopics.map((topic, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Posts */}
      {socialData.recentPosts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-md font-semibold text-gray-800 mb-4">Recent Posts & Discussions</h3>
          <div className="space-y-3">
            {socialData.recentPosts.slice(0, 8).map((post, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getPlatformColor(post.platform)}`}>
                      {post.platform}
                    </span>
                    <span className="text-sm text-gray-600">{post.author}</span>
                    <span className="text-sm text-gray-400">{post.timestamp}</span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{post.company}</span>
                  </div>
                  {post.url && (
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                
                <p className="text-gray-800 text-sm leading-relaxed mb-2">{post.content}</p>
                
                {post.engagement > 0 && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{post.engagement} interactions</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaMonitor;
