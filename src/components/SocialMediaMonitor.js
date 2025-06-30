import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, ExternalLink, Users } from 'lucide-react';

const SocialMediaMonitor = () => {
  const [socialData, setSocialData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 👈 KEYWORDS CONFIGURATION GOES HERE
  const SEARCH_KEYWORDS = {
    companies: {
      'BHP': ['BHP', 'BHP Billiton', 'BHP Group'],
      'Rio Tinto': ['Rio Tinto', 'RioTinto', 'Rio'],
      'Fortescue': ['Fortescue', 'FMG', 'Fortescue Metals'],
      'Hancock Iron Ore': ['Hancock', 'Roy Hill', 'Hancock Prospecting'],
      'Mineral Resources': ['MinRes', 'Mineral Resources', 'MRL']
    },
    issues: [
      'mining jobs', 'FIFO', 'roster', 'shift work', 'mining safety',
      'union', 'strike', 'wage', 'Pilbara', 'iron ore', 'mining worker'
    ]
  };

  // Your API fetching functions use these keywords
  const fetchTwitterData = async (company) => {
    const keywords = SEARCH_KEYWORDS.companies[company];
    const query = `(${keywords.join(' OR ')}) AND (mining OR Pilbara OR FIFO)`;
    // ... rest of Twitter API call
  };

  // ... rest of your component
};

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSocialData(generateData());
      setLoading(false);
    };
    fetchData();
  }, [selectedTimeframe]);

  const refreshData = () => {
    setSocialData(null);
    setLoading(true);
    setTimeout(() => {
      setSocialData(generateData());
      setLoading(false);
    }, 1000);
  };

  const getPlatformColor = (platform) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return 'bg-blue-100 text-blue-800';
      case 'reddit':
        return 'bg-orange-100 text-orange-800';
      case 'facebook':
        return 'bg-blue-100 text-blue-900';
      case 'linkedin':
        return 'bg-blue-100 text-blue-700';
      case 'news':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-2 text-lg">Loading social media discussions...</span>
        </div>
      </div>
    );
  }

  if (!socialData) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media Monitor</h1>
          <p className="text-gray-600 mt-1">Live tracking of employee discussions and mining industry conversations</p>
          <p className="text-sm text-gray-500">Last updated: {socialData.lastUpdated}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
          <button 
            onClick={refreshData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Discussion Summary</h2>
        <div className="space-y-4">
          {socialData.companyMentions.map((company, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{company.company}</h3>
                <span className="text-sm text-gray-600">{company.mentions} mentions</span>
              </div>
              
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent discussions:</h4>
                <div className="space-y-2">
                  {company.recentDiscussions.map((discussion, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{discussion.topic}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${getPlatformColor(discussion.platform)}`}>
                            {discussion.platform}
                          </span>
                          <span className="text-xs text-gray-500">{discussion.mentions} mentions</span>
                          <span className="text-xs text-gray-500">{discussion.lastSeen}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
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

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Posts & Discussions</h2>
        <div className="space-y-4">
          {socialData.recentPosts.map((post, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${getPlatformColor(post.platform)}`}>
                    {post.platform}
                  </span>
                  <span className="text-sm text-gray-600">{post.author}</span>
                  <span className="text-sm text-gray-400">{post.timestamp}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-blue-600" />
              </div>
              
              <p className="text-gray-800 mb-3 leading-relaxed">{post.content}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {post.topics.map((topic, i) => (
                    <span key={i} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {topic}
                    </span>
                  ))}
                </div>
                {post.engagement > 0 && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{post.engagement} interactions</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Monitoring Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{socialData.totalPosts}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">5</div>
            <div className="text-sm text-gray-600">Companies Tracked</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">5</div>
            <div className="text-sm text-gray-600">Platforms</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">Live</div>
            <div className="text-sm text-gray-600">Status</div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">🧪 Demo Mode</h3>
        <div className="text-xs text-blue-700">
          <p>This shows realistic mining industry discussions. In production, this would display live posts from Twitter, Reddit, Facebook, LinkedIn, and news sources using your API credentials.</p>
        </div>
      </div>
    </div>
  );
};

export default CleanSocialMonitor;
