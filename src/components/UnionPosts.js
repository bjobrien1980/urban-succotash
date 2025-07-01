// Fixed UnionPosts Component - src/components/UnionPosts.js
// This version has better error handling and debugging

import React, { useState, useEffect } from 'react';
import { Users, ExternalLink, Clock, MapPin, AlertCircle, TrendingUp } from 'lucide-react';

const UnionPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log('Fetching Facebook posts...');
        
        const response = await fetch('/Facebook-posts.txt');
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Raw text length:', text.length);
        console.log('First 500 characters:', text.substring(0, 500));
        
        const parsedPosts = parsePostsData(text);
        console.log('Parsed posts:', parsedPosts);
        
        setPosts(parsedPosts);
        setDebugInfo(`Loaded ${text.length} characters, found ${parsedPosts.length} posts`);
      } catch (err) {
        console.error('Error fetching Facebook posts:', err);
        setError(`Failed to load union posts: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const parsePostsData = (text) => {
    const posts = [];
    
    try {
      // Split by double newlines or union tags to separate posts
      const sections = text.split(/(?=<union>)/).filter(section => section.trim());
      console.log('Found sections:', sections.length);
      
      sections.forEach((section, index) => {
        try {
          console.log(`Processing section ${index}:`, section.substring(0, 100));
          
          let union = '';
          let date = '';
          let postUrl = '';
          let content = '';
          let imageUrl = '';
          
          // Extract union name
          const unionMatch = section.match(/<union>(.*?)<\/union>/);
          if (unionMatch) {
            union = unionMatch[1].trim();
          }
          
          // Extract date
          const dateMatch = section.match(/<date>(.*?)<\/date>/);
          if (dateMatch) {
            date = dateMatch[1].trim();
          }
          
          // Split content by lines
          const lines = section.split('\n');
          let contentStarted = false;
          
          lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Skip empty lines and tag lines
            if (!trimmedLine || trimmedLine.includes('<union>') || trimmedLine.includes('<date>')) {
              return;
            }
            
            // Check for Facebook share URL
            if (trimmedLine.startsWith('https://www.facebook.com/share/')) {
              postUrl = trimmedLine;
              contentStarted = true;
              return;
            }
            
            // Check for Facebook photo URL
            if (trimmedLine.startsWith('https://www.facebook.com/photo/')) {
              imageUrl = trimmedLine;
              return;
            }
            
            // If we've started content and this isn't a URL, add to content
            if (contentStarted && !trimmedLine.startsWith('https://')) {
              content += trimmedLine + ' ';
            }
          });
          
          // Clean up content
          content = content.trim();
          
          console.log(`Parsed post ${index}:`, { union, date, hasContent: !!content, hasUrl: !!postUrl, hasImage: !!imageUrl });
          
          // Only add if we have the basic required fields
          if (union && date && content) {
            posts.push({
              id: `post_${index}`,
              union: union,
              date: date,
              content: content,
              postUrl: postUrl,
              imageUrl: imageUrl,
              category: determineCategory(content),
              urgency: determineUrgency(content),
              timestamp: formatTimestamp(date)
            });
          } else {
            console.log(`Skipping post ${index} - missing required fields:`, { 
              hasUnion: !!union, 
              hasDate: !!date, 
              hasContent: !!content 
            });
          }
        } catch (error) {
          console.error(`Error parsing post section ${index}:`, error);
        }
      });
      
      console.log(`Successfully parsed ${posts.length} posts`);
      return posts;
      
    } catch (error) {
      console.error('Error in parsePostsData:', error);
      return [];
    }
  };

  const determineCategory = (content) => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('strike') || lowerContent.includes('industrial action')) return 'Strike Action';
    if (lowerContent.includes('safety') || lowerContent.includes('accident') || lowerContent.includes('incident')) return 'Safety';
    if (lowerContent.includes('pay') || lowerContent.includes('wage') || lowerContent.includes('agreement')) return 'Pay & Conditions';
    if (lowerContent.includes('gender') || lowerContent.includes('equity') || lowerContent.includes('discrimination')) return 'Workplace Equity';
    if (lowerContent.includes('negotiat') || lowerContent.includes('bargain')) return 'Negotiations';
    return 'General';
  };

  const determineUrgency = (content) => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('strike') || lowerContent.includes('urgent') || lowerContent.includes('crisis')) return 'high';
    if (lowerContent.includes('concern') || lowerContent.includes('dispute') || lowerContent.includes('issue')) return 'medium';
    return 'low';
  };

  const formatTimestamp = (dateStr) => {
    try {
      const postDate = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now - postDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return dateStr;
    }
  };

  const getUnionIcon = (unionName) => {
    if (unionName.toLowerCase().includes('maritime')) return '⚓';
    if (unionName.toLowerCase().includes('mining')) return '⛏️';
    if (unionName.toLowerCase().includes('transport')) return '🚛';
    if (unionName.toLowerCase().includes('construction')) return '🏗️';
    return '👥';
  };

  const urgencyColors = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-yellow-500 bg-yellow-50', 
    low: 'border-blue-500 bg-blue-50'
  };

  const urgencyIcons = {
    high: <AlertCircle className="w-4 h-4 text-red-500" />,
    medium: <TrendingUp className="w-4 h-4 text-yellow-500" />,
    low: <Users className="w-4 h-4 text-blue-500" />
  };

  const categoryColors = {
    'Strike Action': 'bg-red-100 text-red-800',
    'Safety': 'bg-orange-100 text-orange-800',
    'Pay & Conditions': 'bg-green-100 text-green-800',
    'Workplace Equity': 'bg-purple-100 text-purple-800',
    'Negotiations': 'bg-blue-100 text-blue-800',
    'General': 'bg-gray-100 text-gray-800'
  };

  const getDefaultThumbnail = (unionName) => {
    const unionImages = {
      'Maritime Union of Australia': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
      'Mining and Energy Union': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
      'Australian Workers Union': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=200&fit=crop',
      'Construction Forestry Mining Energy Union': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop'
    };
    
    for (const [key, image] of Object.entries(unionImages)) {
      if (unionName.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
        return image;
      }
    }
    
    return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=200&fit=crop';
  };

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Union Social Media Updates</h2>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Union Social Media Updates</h2>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center text-red-500">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">Error Loading Posts</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs text-gray-500 mt-2">{debugInfo}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Union Social Media Updates
        <span className="text-sm text-green-600 ml-2">● Live ({posts.length})</span>
      </h2>
      
      {/* Debug info for troubleshooting */}
      {posts.length === 0 && debugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm">
          <strong>Debug:</strong> {debugInfo}
        </div>
      )}
      
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className={`bg-white rounded-lg shadow-sm border-l-4 ${urgencyColors[post.urgency]} p-6`}>
            <div className="flex items-start space-x-4">
              
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <img 
                  src={post.imageUrl || getDefaultThumbnail(post.union)}
                  alt={`${post.union} post`}
                  className="w-24 h-16 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.target.src = getDefaultThumbnail(post.union);
                  }}
                />
              </div>
              
              {/* Content */}
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center space-x-2 mb-2">
                  {urgencyIcons[post.urgency]}
                  <span className="text-lg mr-1">{getUnionIcon(post.union)}</span>
                  <span className="text-sm font-semibold text-gray-800">{post.union}</span>
                  <span className="text-gray-400">•</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors[post.category] || categoryColors['General']}`}>
                    {post.category}
                  </span>
                </div>
                
                {/* Post Content */}
                <div className="mb-3">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {post.content.length > 300 ? post.content.substring(0, 300) + '...' : post.content}
                  </p>
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {post.timestamp}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      WA
                    </span>
                  </div>
                  {post.postUrl && (
                    <button 
                      onClick={() => window.open(post.postUrl, '_blank')}
                      className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View on Facebook</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {posts.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No union posts found</h3>
            <p className="text-gray-600">Check the browser console for debugging information.</p>
            {debugInfo && <p className="text-xs text-gray-500 mt-2">{debugInfo}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnionPosts;
