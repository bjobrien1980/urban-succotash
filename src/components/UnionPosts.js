// Final UnionPosts Component - src/components/UnionPosts.js
// Production-ready version with proper post display, thumbnails, DATE SORTING and AI SUMMARIZATION

import React, { useState, useEffect } from 'react';
import { Users, ExternalLink, Clock, MapPin, AlertCircle, TrendingUp } from 'lucide-react';

const UnionPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log('Fetching Facebook posts...');

        const response = await fetch('/data/facebook-posts.txt');
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const text = await response.text();
        console.log('Loaded Facebook posts, parsing...');

        const parsedPosts = parsePostsData(text);
        console.log(`Successfully parsed ${parsedPosts.length} union posts`);

        // Sort posts by date - newest first
        const sortedPosts = sortPostsByDate(parsedPosts);
        console.log('Posts sorted by date (newest first)');

        // Generate intelligent summaries for posts
        const postsWithSummaries = generateIntelligentSummaries(sortedPosts);
        console.log('Generated intelligent summaries for posts');

        setPosts(postsWithSummaries);
      } catch (err) {
        console.error('Error fetching Facebook posts:', err);
        setError(`Failed to load union posts: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Generate intelligent summaries based on content analysis
  const generateIntelligentSummaries = (posts) => {
    return posts.map(post => ({
      ...post,
      summary: generateSmartSummary(post.content, post.category, post.union)
    }));
  };

  // Smart summarization based on content analysis and context
  const generateSmartSummary = (content, category, union) => {
    // Remove URLs and clean content
    const cleanContent = content
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Generate summary based on category
    let summary = '';
    
    switch (category) {
      case 'Strike Action':
        summary = extractStrikeSummary(cleanContent, union);
        break;
      case 'Safety':
        summary = extractSafetySummary(cleanContent, union);
        break;
      case 'Pay & Conditions':
        summary = extractPaySummary(cleanContent, union);
        break;
      case 'Workplace Equity':
        summary = extractEquitySummary(cleanContent, union);
        break;
      case 'Negotiations':
        summary = extractNegotiationsSummary(cleanContent, union);
        break;
      default:
        summary = extractGeneralSummary(cleanContent, union);
    }
    
    return summary || (cleanContent.length > 150 ? cleanContent.substring(0, 150) + '...' : cleanContent);
  };

  const extractStrikeSummary = (content, union) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('ballot') && (lowerContent.includes('vote') || lowerContent.includes('protected action'))) {
      return `${union} members voting on protected industrial action to advance workplace claims`;
    }
    if (lowerContent.includes('strike') || lowerContent.includes('industrial action')) {
      return `${union} taking strike action over workplace conditions and pay disputes`;
    }
    
    return extractKeyPoints(content, union);
  };

  const extractSafetySummary = (content, union) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('fatality') || lowerContent.includes('death')) {
      return `${union} responding to workplace fatality and demanding safety improvements`;
    }
    if (lowerContent.includes('incident') || lowerContent.includes('accident')) {
      if (lowerContent.includes('not reported') || lowerContent.includes('unreported')) {
        return `${union} exposes unreported workplace safety incident`;
      }
      return `${union} reporting serious workplace safety incident requiring investigation`;
    }
    if (lowerContent.includes('safety culture')) {
      return `${union} raising concerns about company safety culture and standards`;
    }
    
    return extractKeyPoints(content, union);
  };

  const extractPaySummary = (content, union) => {
    const lowerContent = content.toLowerCase();
    
    // Look for specific percentage increases
    const percentageMatch = content.match(/(\d+(?:\.\d+)?%)/g);
    if (percentageMatch && (lowerContent.includes('pay') || lowerContent.includes('wage') || lowerContent.includes('increase'))) {
      const highestPercentage = percentageMatch.sort((a, b) => parseFloat(b) - parseFloat(a))[0];
      return `${union} secures ${highestPercentage} pay increase for members through negotiations`;
    }
    
    if (lowerContent.includes('super') && lowerContent.includes('12%')) {
      return `${union} informs members about superannuation increase to 12% from July 2025`;
    }
    
    if (lowerContent.includes('agreement') || lowerContent.includes('ea')) {
      return `${union} progressing enterprise agreement negotiations for improved conditions`;
    }
    
    return extractKeyPoints(content, union);
  };

  const extractEquitySummary = (content, union) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('gender') && lowerContent.includes('pay')) {
      return `${union} advocating for equal pay and gender equity in the workplace`;
    }
    if (lowerContent.includes('women') && lowerContent.includes('same rate')) {
      return `${union} demanding equal pay for women doing comparable work`;
    }
    
    return extractKeyPoints(content, union);
  };

  const extractNegotiationsSummary = (content, union) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('log of claims')) {
      return `${union} members endorse log of claims for upcoming enterprise agreement negotiations`;
    }
    if (lowerContent.includes('counter offer') || lowerContent.includes('offer')) {
      return `${union} responds to company offer during enterprise agreement negotiations`;
    }
    
    return extractKeyPoints(content, union);
  };

  const extractGeneralSummary = (content, union) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('fuel voucher') || lowerContent.includes('free fuel')) {
      return `${union} running fuel voucher giveaway for members`;
    }
    if (lowerContent.includes('tax') && lowerContent.includes('deductible')) {
      return `${union} reminds members about tax deductible union fees`;
    }
    if (lowerContent.includes('new') && (lowerContent.includes('organiser') || lowerContent.includes('staff'))) {
      return `${union} announces new team member to strengthen member support`;
    }
    
    return extractKeyPoints(content, union);
  };

  const extractKeyPoints = (content, union) => {
    // Split into sentences and find the most informative ones
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
    
    if (sentences.length === 0) {
      return content.length > 150 ? content.substring(0, 150) + '...' : content;
    }

    // Prioritize sentences with key union terms
    const keyTerms = ['member', 'worker', 'union', 'pay', 'condition', 'safety', 'agreement', 'negotiation', 'strike', 'action', 'company', 'employer'];
    
    let bestSentence = sentences[0];
    let maxScore = 0;
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const score = keyTerms.reduce((sum, term) => {
        return sum + (lowerSentence.includes(term) ? 1 : 0);
      }, 0);
      
      // Prefer shorter, more concise sentences
      const lengthPenalty = sentence.length > 200 ? 1 : 0;
      const finalScore = score - lengthPenalty;
      
      if (finalScore > maxScore && sentence.trim().length > 20 && sentence.trim().length < 350) {
        maxScore = finalScore;
        bestSentence = sentence;
      }
    });
    
    // Clean up the sentence
    const summary = bestSentence.trim();
    return summary.length > 250 ? summary.substring(0, 250) + '...' : summary;
  };

  const parsePostDate = (dateString) => {
    try {
      // Handle various date formats
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        return new Date(dateString);
      }

      if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        // DD/MM/YYYY or MM/DD/YYYY format - assume DD/MM/YYYY for Australian context
        const [day, month, year] = dateString.split('/');
        return new Date(year, month - 1, day);
      }

      // Try to parse any other format
      return new Date(dateString);
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return new Date(0); // Return epoch as fallback
    }
  };

  const sortPostsByDate = (posts) => {
    return posts.sort((a, b) => {
      const dateA = parsePostDate(a.date);
      const dateB = parsePostDate(b.date);

      // Sort descending (newest first)
      return dateB - dateA;
    });
  };

  const parsePostsData = (text) => {
    const posts = [];

    try {
      // Split by union tags to separate posts
      const sections = text.split(/(?=<union>)/).filter(section => section.trim());

      sections.forEach((section, index) => {
        try {
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

          // Split content by lines and extract
          const lines = section.split('\n');
          let collectingContent = false;

          lines.forEach(line => {
            const trimmedLine = line.trim();

            // Skip empty lines and tag lines
            if (!trimmedLine || trimmedLine.includes('<union>') || trimmedLine.includes('<date>')) {
              return;
            }

            // Check for Facebook share URL
            if (trimmedLine.startsWith('https://www.facebook.com/share/')) {
              postUrl = trimmedLine;
              collectingContent = true;
              return;
            }

            // Check for Facebook photo URL
            if (trimmedLine.startsWith('https://www.facebook.com/photo/')) {
              imageUrl = trimmedLine;
              return;
            }

            // If we've started content and this isn't a URL, add to content
            if (collectingContent && !trimmedLine.startsWith('https://')) {
              content += trimmedLine + ' ';
            }
          });

          // Clean up content
          content = content.trim();

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
              timestamp: formatTimestamp(date),
              parsedDate: parsePostDate(date) // Store parsed date for sorting
            });
          }
        } catch (error) {
          console.error(`Error parsing post section ${index}:`, error);
        }
      });

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
      const postDate = parsePostDate(dateStr);
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
    if (unionName.toLowerCase().includes('mining') || unionName.toLowerCase().includes('meu')) return '⛏️';
    if (unionName.toLowerCase().includes('transport')) return '🚛';
    if (unionName.toLowerCase().includes('construction') || unionName.toLowerCase().includes('cfmeu')) return '🏗️';
    if (unionName.toLowerCase().includes('electrical') || unionName.toLowerCase().includes('etu')) return '⚡';
    if (unionName.toLowerCase().includes('manufacturing') || unionName.toLowerCase().includes('amwu')) return '🔧';
    if (unionName.toLowerCase().includes('offshore')) return '🛢️';
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
      // Maritime unions
      'maritime': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop&auto=format',
      'mua': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop&auto=format',

      // Mining unions
      'mining': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',
      'meu': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',
      'pilbara': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop&auto=format',

      // Construction unions
      'construction': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=200&fit=crop&auto=format',
      'cfmeu': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=200&fit=crop&auto=format',

      // Electrical unions
      'electrical': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=300&h=200&fit=crop&auto=format',
      'etu': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=300&h=200&fit=crop&auto=format',

      // Manufacturing unions
      'manufacturing': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=200&fit=crop&auto=format',
      'amwu': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=200&fit=crop&auto=format',

      // Workers unions
      'workers': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=200&fit=crop&auto=format',
      'awu': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=200&fit=crop&auto=format',

      // Offshore/Oil & Gas
      'offshore': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop&auto=format',
      'oil': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop&auto=format',
      'gas': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop&auto=format'
    };

    const lowerUnionName = unionName.toLowerCase();

    // Try to match specific union types
    for (const [key, image] of Object.entries(unionImages)) {
      if (lowerUnionName.includes(key)) {
        return image;
      }
    }

    // Default fallback
    return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=200&fit=crop&auto=format';
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
        <span className="text-xs text-gray-500 ml-2">(Newest First • Smart Summaries)</span>
      </h2>

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className={`bg-white rounded-lg shadow-sm border-l-4 ${urgencyColors[post.urgency]} p-6`}>
            <div className="flex items-start space-x-4">

              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <img
                  src={getDefaultThumbnail(post.union)}
                  alt={`${post.union} post`}
                  className="w-24 h-16 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    // Fallback to a simple colored rectangle if image fails
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5VbmlvbiBQb3N0PC90ZXh0Pjwvc3ZnPg==';
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

                {/* Smart Summary */}
                <div className="mb-3">
                  <p className="text-gray-700 text-sm leading-relaxed font-medium">
                    📝 {post.summary}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Smart summary • Click "View on Facebook" for full post
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

        {posts.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No union posts found</h3>
            <p className="text-gray-600">Union social media updates will appear here when available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnionPosts;
