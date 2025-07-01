// Diagnostic UnionPosts Component - src/components/UnionPosts.js
// This version will show us exactly what's in your file

import React, { useState, useEffect } from 'react';
import { Users, ExternalLink, Clock, MapPin, AlertCircle, TrendingUp } from 'lucide-react';

const UnionPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawContent, setRawContent] = useState('');
  const [showRawContent, setShowRawContent] = useState(false);

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
        console.log('Raw text:', text);
        console.log('Raw text length:', text.length);
        
        setRawContent(text);
        
        // Try to parse
        const parsedPosts = parsePostsData(text);
        console.log('Parsed posts:', parsedPosts);
        
        setPosts(parsedPosts);
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
    console.log('=== PARSING DEBUG ===');
    console.log('Text to parse:', JSON.stringify(text));
    
    // Let's try a very simple approach first
    // Look for union tags
    const unionMatches = text.match(/<union>.*?<\/union>/g);
    console.log('Found union matches:', unionMatches);
    
    const dateMatches = text.match(/<date>.*?<\/date>/g);
    console.log('Found date matches:', dateMatches);
    
    // Try splitting by union tags
    const sections = text.split(/(?=<union>)/).filter(section => section.trim());
    console.log('Split into sections:', sections.length);
    sections.forEach((section, i) => {
      console.log(`Section ${i}:`, JSON.stringify(section));
    });
    
    const posts = [];
    
    sections.forEach((section, index) => {
      console.log(`\n--- Processing section ${index} ---`);
      console.log('Section content:', section);
      
      // Extract union
      const unionMatch = section.match(/<union>(.*?)<\/union>/);
      const union = unionMatch ? unionMatch[1].trim() : '';
      console.log('Extracted union:', union);
      
      // Extract date
      const dateMatch = section.match(/<date>(.*?)<\/date>/);
      const date = dateMatch ? dateMatch[1].trim() : '';
      console.log('Extracted date:', date);
      
      // Extract content (everything after the date tag until the image URL)
      let content = '';
      const lines = section.split('\n');
      let collectingContent = false;
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        console.log('Processing line:', trimmedLine);
        
        if (trimmedLine.includes('</date>')) {
          collectingContent = true;
          return;
        }
        
        if (collectingContent && trimmedLine && !trimmedLine.startsWith('https://')) {
          content += trimmedLine + ' ';
        }
      });
      
      content = content.trim();
      console.log('Extracted content:', content);
      
      if (union && date && content) {
        const post = {
          id: `post_${index}`,
          union: union,
          date: date,
          content: content,
          category: 'General',
          urgency: 'low',
          timestamp: date
        };
        console.log('Created post:', post);
        posts.push(post);
      } else {
        console.log('Skipping - missing data:', { union: !!union, date: !!date, content: !!content });
      }
    });
    
    console.log('Final posts array:', posts);
    return posts;
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

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Union Social Media Updates
        <span className="text-sm text-blue-600 ml-2">● Debug Mode</span>
      </h2>
      
      {/* Debug Panel */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-yellow-800">Debug Information</h3>
          <button 
            onClick={() => setShowRawContent(!showRawContent)}
            className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded"
          >
            {showRawContent ? 'Hide' : 'Show'} Raw Content
          </button>
        </div>
        
        <div className="text-sm text-yellow-700 space-y-1">
          <p><strong>File loaded:</strong> {rawContent.length > 0 ? 'Yes' : 'No'}</p>
          <p><strong>File size:</strong> {rawContent.length} characters</p>
          <p><strong>Posts found:</strong> {posts.length}</p>
          <p><strong>Error:</strong> {error || 'None'}</p>
        </div>
        
        {showRawContent && (
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">Raw File Content:</h4>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-60 whitespace-pre-wrap">
              {rawContent || 'No content loaded'}
            </pre>
          </div>
        )}
        
        <div className="mt-3 text-xs text-yellow-600">
          Check the browser console (F12) for detailed parsing logs.
        </div>
      </div>

      {/* Posts Display */}
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-800">{post.union}</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-500">{post.date}</span>
              </div>
              <p className="text-gray-700 text-sm">{post.content}</p>
            </div>
          </div>
        ))}
        
        {posts.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No union posts parsed</h3>
            <p className="text-gray-600">Check the debug panel above and browser console for details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnionPosts;
