// components/FacebookPostsProcessor.js - Processes pasted Facebook content
import React, { useState, useEffect } from 'react';
import { Calendar, ExternalLink, Image, AlertTriangle } from 'lucide-react';

const FacebookPostsProcessor = () => {
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
        
        // Filter for posts from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentPosts = processedPosts.filter(post => 
          new Date(post.date) >= sevenDaysAgo
        );
        
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
      const imageMatch = chunk.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif))/i) || 
                         chunk.includes('📷') || chunk.includes('Photo') || chunk.includes('Image');
      const hasImage = !!imageMatch;
      
      // Get the main content (remove metadata and clean up)
      let content = chunk
        .replace(/^[^·]*·[^·]*·/, '') // Remove header metadata
        .replace(/(https?:\/\/[^\s]+)/g, '') // Remove URLs
        .replace(/\n\s*\n/g, '\n') // Remove extra newlines
        .trim();
      
      // Generate summary using Claude's completion API
      const summary = await generateSummary(content, unionName);
      
      if (!summary || summary.length < 10) return null;
      
      return {
        id: Date.now() + Math.random(),
        unionName,
        summary,
        content: content.substring(0, 200) + '...', // Truncated content for reference
        url: facebookUrl,
        date: date.toISOString(),
        hasImage,
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

  // Generate AI summary using Claude completion
  const generateSummary = async (content, unionName) => {
    try {
      const prompt = `
        Create a single-line summary (maximum 80 characters) of this union Facebook post:
        
        Union: ${unionName}
        Content: ${content}
        
        Focus on the key action, issue, or announcement. Be concise and factual.
        Respond with ONLY the summary text, no quotes or extra formatting.
      `;
      
      const summary = await window.claude.complete(prompt);
      return summary.trim().replace(/['"]/g, ''); // Remove quotes if any
      
    } catch (error) {
      console.error('Error generating summary:', error);
      // Fallback to simple extraction
      const sentences = content.split(/[.!?]/);
      const firstSentence = sentences[0]?.trim() || content.substring(0, 80);
      return firstSentence.length > 80 ? firstSentence.substring(0, 77) + '...' : firstSentence;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Union Posts</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Union Posts</h2>
        <div className="text-red-600 flex items-center">
          <AlertTriangle size={20} className="mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Union Posts (Last 7 Days)</h2>
      
      {posts.length === 0 ? (
        <p className="text-gray-600">No recent union posts found.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center space-x-3 flex-1">
                {post.hasImage && (
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <Image size={16} className="text-gray-500" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.summary}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="text-blue-600 font-medium">{post.unionName}</span>
                    <span>•</span>
                    <div className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {formatDate(post.date)}
                    </div>
                  </div>
                </div>
              </div>
              
              {post.url && (
                <a 
                  href={post.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors ml-4"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Showing posts from the last 7 days • Auto-updated from pasted Facebook content
      </div>
    </div>
  );
};

export default FacebookPostsProcessor;
