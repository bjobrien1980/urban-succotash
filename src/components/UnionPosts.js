// components/UnionPosts.js - React component to display union posts
import React, { useState, useEffect } from 'react';
import { getRecentUnionPosts } from '../lib/sanity';
import { Calendar, ExternalLink, Tag, AlertTriangle } from 'lucide-react';

const UnionPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const unionPosts = await getRecentUnionPosts(10);
        setPosts(unionPosts);
      } catch (err) {
        setError('Failed to fetch union posts');
        console.error('Error fetching union posts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Union Activity</h2>
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
        <h2 className="text-xl font-bold text-gray-800 mb-4">Union Activity</h2>
        <div className="text-red-600 flex items-center">
          <AlertTriangle size={20} className="mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Union Activity</h2>
      
      {posts.length === 0 ? (
        <p className="text-gray-600">No union posts available at the moment.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post._id} className="border-l-4 border-blue-500 pl-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                  <p className="text-sm text-blue-600 font-medium">{post.unionName}</p>
                </div>
                {post.priority && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(post.priority)}`}>
                    {post.priority}
                  </span>
                )}
              </div>
              
              <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                {post.content}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    {formatDate(post.publishedAt)}
                  </div>
                  {post.category && (
                    <div className="flex items-center">
                      <Tag size={14} className="mr-1" />
                      {post.category}
                    </div>
                  )}
                </div>
                
                {post.url && (
                  <a 
                    href={post.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink size={14} className="mr-1" />
                    View Post
                  </a>
                )}
              </div>
              
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnionPosts;
