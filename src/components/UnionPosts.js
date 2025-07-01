// components/UnionPosts.js - Improved version with better layout and functionality
import React, { useState, useEffect } from 'react';
import { Calendar, ExternalLink, Image, AlertTriangle, Users } from 'lucide-react';

const UnionPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function processFacebookDocument() {
      try {
        setLoading(true);
        
        // Fetch the raw Facebook posts document
        const response = await fetch('/data/facebook-posts.txt');
        if (!response.ok) {
          throw new Error('Failed to fetch Facebook posts document');
        }
        
        const rawText = await response.text();
        const processedPosts = await processRawFacebookText(rawText);
        
        // Filter for posts from last 7 days (exact 7 days, not just this week)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); // Start of day 7 days ago
        
        const recentPosts = processedPosts.filter(post => {
          const postDate = new Date(post.date);
          return postDate >= sevenDaysAgo;
        });
        
        setPosts(recentPosts);
      } catch (err) {
        setError('Failed to process Facebook posts');
        console.error('Error processing Facebook posts:', err);
      } finally {
        setLoading(false);
      }
    }

    processFacebookDocument();
  }, []);

  // Function to process raw Facebook text and extract posts
  const processRawFacebookText = async (rawText) => {
    const posts = [];
    
    // Split by common Facebook post separators
    const chunks = rawText.split(/(?=\n[A-Z][a-zA-Z\s]+ · \d+[hmd]|CFMEU|Australian Workers|Maritime Union|Transport Workers)/);
    
    for (let chunk of chunks) {
      if (chunk.trim().length < 50) continue; // Skip very short chunks
      
      const post = await extractPostData(chunk.trim());
      if (post) {
        posts.push(post);
      }
    }
    
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Extract individual post data from a chunk
  const extractPostData = async (chunk) => {
    try {
      // Extract union name (look for common union names)
      const unionPatterns = [
        /CFMEU[^·\n]*/i,
        /Australian Workers Union[^·\n]*/i,
        /Maritime Union[^·\n]*/i,
        /Transport Workers[^·\n]*/i,
        /Construction Workers[^·\n]*/i,
        /Electrical Trades[^·\n]*/i,
        /Plumbers Union[^·\n]*/i
      ];
      
      let unionName = 'Unknown Union';
      for (let pattern of unionPatterns) {
        const match = chunk.match(pattern);
        if (match) {
          unionName = match[0].trim();
          break;
        }
      }
      
      // Extract timestamp (look for patterns like "3h", "2d", "1w")
      const timeMatch = chunk.match(/(\d+[hmdw])\s/);
      const relativeTime = timeMatch ? timeMatch[1] : null;
      
      // Convert relative time to actual date
      const date = convertRelativeTimeToDate(relativeTime);
      
      // Extract Facebook URL (look for facebook.com links)
      const urlMatch = chunk.match(/(https?:\/\/(?:www\.)?facebook\.com\/[^\s]+)/);
      const facebookUrl = urlMatch ? urlMatch[1] : null;
      
      // Extract images (look for image URLs or image indicators)
      const imageMatch = chunk.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif))/i);
      const hasImageEmoji = chunk.includes('📷') || chunk.includes('🖼️') || chunk.includes('Photo') || chunk.includes('Image');
      const imageUrl = imageMatch ? imageMatch[1] : null;
      
      // Get the main content (remove metadata and clean up)
      let content = chunk
        .replace(/^[^·]*·[^·]*·/, '') // Remove header metadata
        .replace(/(https?:\/\/[^\s]+)/g, '') // Remove URLs
        .replace(/\n\s*\n/g, '\n') // Remove extra newlines
        .trim();
      
      // Generate detailed summary using Claude's completion API
      const summary = await generateDetailedSummary(content, unionName);
      
      if (!summary || summary.length < 20) return null;
      
      return {
        id: Date.now() + Math.random(),
        unionName,
        summary,
        content: content.length > 300 ? content.substring(0, 300) + '...' : content,
        url: facebookUrl,
        date: date.toISOString(),
        hasImage: hasImageEmoji || !!imageUrl,
        imageUrl: imageUrl,
        originalText: chunk // Keep original for debugging
      };
      
    } catch (error) {
      console.error('Error extracting post data:', error);
      return null;
    }
  };

  // Convert relative time (3h, 2d) to actual date
  const convertRelativeTimeToDate = (relativeTime) => {
    const now = new Date();
    
    if (!relativeTime) return now;
    
    const value = parseInt(relativeTime);
    const unit = relativeTime.slice(-1);
    
    switch (unit) {
      case 'h':
        now.setHours(now.getHours() - value);
        break;
      case 'd':
        now.setDate(now.getDate() - value);
        break;
      case 'w':
        now.setDate(now.getDate() - (value * 7));
        break;
      case 'm':
        now.setMinutes(now.getMinutes() - value);
        break;
      default:
        // If no clear time indicator, assume it's recent
        break;
    }
    
    return now;
  };

  // Generate detailed AI summary using Claude completion
  const generateDetailedSummary = async (content, unionName) => {
    try {
      const prompt = `
        Create a detailed 2-3 sentence summary of this union Facebook post:
        
        Union: ${unionName}
        Content: ${content}
        
        Focus on:
        - The main issue, action, or announcement
        - Key details (locations, companies, dates mentioned)
        - Impact on workers or industry
        
        Write in a professional news style. Maximum 200 characters.
        Respond with ONLY the summary text, no quotes or extra formatting.
      `;
      
      const summary = await window.claude.complete(prompt);
      return summary.trim().replace(/['"]/g, ''); // Remove quotes if any
      
    } catch (error) {
      console.error('Error generating summary:', error);
      // Fallback to simple extraction
      const sentences = content.split(/[.!?]/);
      const firstTwoSentences = sentences.slice(0, 2).join('. ').trim();
      return firstTwoSentences.length > 200 ? firstTwoSentences.substring(0, 197) + '...' : firstTwoSentences;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex items-center mb-6">
          <Users className="mr-3 text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Union Activity Feed</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-16 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex items-center mb-6">
          <Users className="mr-3 text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Union Activity Feed</h2>
        </div>
        <div className="text-red-600 flex items-center bg-red-50 p-4 rounded-lg">
          <AlertTriangle size={20} className="mr-2" />
          {error}
        </div>
      </div>
    );
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <Users className="mr-3 text-blue-600" size={24} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Union Activity Feed</h2>
            <p className="text-sm text-gray-600">
              Posts from {sevenDaysAgo.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - Today
            </p>
          </div>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-blue-700 font-semibold">{posts.length} Recent Posts</span>
        </div>
      </div>
      
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg">No union posts found in the last 7 days</p>
          <p className="text-gray-500 text-sm mt-2">Check back later for updates</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-600">{post.unionName}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar size={14} className="mr-1" />
                      {formatDate(post.date)}
                    </div>
                  </div>
                </div>
                
                {post.url && (
                  <a 
                    href={post.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    View Original
                  </a>
                )}
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-800 leading-relaxed mb-3">
                  {post.summary}
                </p>
                
                {/* Post thumbnail/image indicator */}
                {post.hasImage && (
                  <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                    {post.imageUrl ? (
                      <div className="relative">
                        <img 
                          src={post.imageUrl} 
                          alt="Post thumbnail" 
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-20 h-20 bg-gray-200 rounded-lg items-center justify-center hidden">
                          <Image size={24} className="text-gray-500" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Image size={24} className="text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        📷 This post contains images or media
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click "View Original" to see full content
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Post Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Auto-generated summary from Facebook post
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>Last 7 days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Updates automatically from manually curated Facebook posts • 
          Showing posts from the last 7 days only
        </p>
      </div>
    </div>
  );
};

export default UnionPosts;
