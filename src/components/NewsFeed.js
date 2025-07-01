import React from 'react';
import { Search, AlertCircle, TrendingUp, Users, MapPin, Clock, ExternalLink } from 'lucide-react';

const NewsFeed = ({ 
  filteredUnionData, 
  filteredMarketNews, 
  unionNewsCount, 
  marketNewsCount 
}) => {
  // Urgency styling configuration
  const urgencyColors = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-yellow-500 bg-yellow-50', 
    low: 'border-green-500 bg-green-50'
  };

  const urgencyIcons = {
    high: <AlertCircle className="w-4 h-4 text-red-500" />,
    medium: <TrendingUp className="w-4 h-4 text-yellow-500" />,
    low: <Users className="w-4 h-4 text-green-500" />
  };

  // Union News Article Component
  const UnionNewsArticle = ({ item }) => (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${urgencyColors[item.urgency]} p-6`}>
      <div className="flex items-start space-x-4">
        <img 
          src={item.thumbnail} 
          alt={item.title}
          className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop';
          }}
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {urgencyIcons[item.urgency]}
            <span className="text-sm font-medium text-gray-600">{item.union}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500">{item.category}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {item.location}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
          <p className="text-gray-700 mb-3">{item.summary}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {item.timestamp}
              </span>
              <span>Source: {item.source}</span>
            </div>
            {item.url && (
              <button 
                onClick={() => window.open(item.url, '_blank')}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Read Full Article</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Market News Article Component
  const MarketNewsArticle = ({ item }) => (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${urgencyColors[item.urgency]} p-4`}>
      <div className="flex items-start space-x-3">
        <img 
          src={item.thumbnail} 
          alt={item.title}
          className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop';
          }}
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-blue-600">{item.company}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500">{item.category}</span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
          <p className="text-gray-700 text-sm mb-3">{item.summary}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {item.timestamp}
              </span>
              <span>Source: {item.source}</span>
            </div>
            {item.url && (
              <button 
                onClick={() => window.open(item.url, '_blank')}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-xs"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Read More</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Empty State Component
  const EmptyState = ({ title, description, iconSize = "w-12 h-12" }) => (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <Search className={`${iconSize} text-gray-400 mx-auto mb-4`} />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Union Activity Feed */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Union Activity Feed 
          {unionNewsCount > 0 && (
            <span className="text-sm text-green-600 ml-2">● Live ({unionNewsCount})</span>
          )}
        </h2>
        <div className="space-y-4">
          {filteredUnionData && filteredUnionData.length > 0 ? (
            filteredUnionData.map(item => (
              <UnionNewsArticle key={item.id} item={item} />
            ))
          ) : (
            <EmptyState
              title="No union updates found"
              description="No union activity matches your current filters. Try adjusting your search criteria."
            />
          )}
        </div>
      </div>

      {/* Market Watch Feed */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Market Watch - WA Iron Ore Miners
          {marketNewsCount > 0 && (
            <span className="text-sm text-green-600 ml-2">● Live ({marketNewsCount})</span>
          )}
        </h2>
        <div className="space-y-4">
          {filteredMarketNews && filteredMarketNews.length > 0 ? (
            filteredMarketNews.map(item => (
              <MarketNewsArticle key={item.id} item={item} />
            ))
          ) : (
            <EmptyState
              title="No market news found"
              description="No market updates match your current filters."
              iconSize="w-8 h-8"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsFeed;
