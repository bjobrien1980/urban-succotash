import React from 'react';

const NewsFilters = ({
  selectedUnion,
  setSelectedUnion,
  selectedCategory,
  setSelectedCategory,
  selectedCompany,
  setSelectedCompany,
  selectedMarketCategory,
  setSelectedMarketCategory
}) => {
  // Configuration arrays
  const unions = [
    'Australian Workers Union',
    'Western Mine Workers Alliance',
    'Australian Manufacturing Workers Union',
    'Electrical Trades Union',
    'Mining and Energy Union',
    'Maritime Union of Australia',
    'Offshore Alliance'
  ];

  const categories = [
    'Strike Action',
    'Negotiations',
    'Policy Change',
    'Safety',
    'Membership'
  ];

  const companies = [
    'BHP',
    'Rio Tinto',
    'Fortescue',
    'Hancock Iron Ore',
    'Mineral Resources'
  ];

  const marketCategories = [
    'Expansion',
    'Production',
    'Sustainability',
    'Regulatory',
    'Commercial'
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Union
          </label>
          <select 
            value={selectedUnion} 
            onChange={(e) => setSelectedUnion(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Unions</option>
            {unions.map(union => (
              <option key={union} value={union}>{union}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category
          </label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Company
          </label>
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Companies</option>
            {companies.map(company => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Market Category
          </label>
          <select 
            value={selectedMarketCategory} 
            onChange={(e) => setSelectedMarketCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Market Categories</option>
            {marketCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default NewsFilters;
