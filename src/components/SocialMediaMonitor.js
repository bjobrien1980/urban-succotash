import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, ExternalLink, Users } from 'lucide-react';

const SocialMediaMonitor = () => {
  const [socialData, setSocialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  const generateData = () => {
    return {
      companyMentions: [
        {
          company: 'BHP',
          mentions: 23,
          recentDiscussions: [
            {
              topic: "BHP's new 2-week on/1-week off roster changes causing family stress",
              platform: 'Twitter',
              mentions: 8,
              lastSeen: '2 hours ago'
            }
          ],
          keyTopics: ['roster changes', 'safety protocols']
        },
        {
          company: 'Rio Tinto',
          mentions: 19,
          recentDiscussions: [
            {
              topic: "Rio Tinto wage negotiations progress after months of delays",
              platform: 'Twitter',
              mentions: 7,
              lastSeen: '3 hours ago'
            }
          ],
          keyTopics: ['wage negotiations', 'safety training']
        },
        {
          company: 'Fortescue',
          mentions: 16,
          recentDiscussions: [
            {
              topic: "Fortescue's Aboriginal employment program creating opportunities",
              platform: 'LinkedIn',
              mentions: 9,
              lastSeen: '1 hour ago'
            }
          ],
          keyTopics: ['indigenous employment', 'green initiatives']
        }
      ],
      recentPosts: [
        {
          id: '1',
          platform: 'Twitter',
          author: '@pilbara_worker',
          content: "Another safety meeting cancelled due to operational requirements. When will companies prioritize worker safety?",
          engagement: 127,
          timestamp: '2 hours ago',
          topics: ['safety', 'management']
        }
      ],
      lastUpdated: new Date().toLocaleString('en-AU', {
        timeZone: 'Australia/Perth'
      }),
      totalPosts: 45
    };
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
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-2 text-lg">Loading social media discussions...</span>
        </div>
      </div>
    );
  }

  if (!socialData) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Monitor</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-gray-800">Company Discussion Summary</h3>
          <button 
            onClick={refreshData}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <div className="space-y-3">
          {socialData.companyMentions.map((company, index) => (
            <div key={index} className="p-3 border border-gray-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{company.company}</h4>
                <span className="text-sm text-gray-600">{company.mentions} mentions</span>
              </div>
              
              <div className="mb-2">
                {company.recentDiscussions.map((discussion, i) => (
                  <div key={i} className="text-sm text-gray-700 mb-1">
                    {discussion.topic}
                    <div className="text-xs text-gray-500">
                      {discussion.platform} • {discussion.mentions} mentions • {discussion.lastSeen}
                    </div>
                  </div>
                ))}
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
    </div>
  );
};

export default SocialMediaMonitor;
