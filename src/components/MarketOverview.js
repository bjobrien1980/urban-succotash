import React from 'react';

const MarketOverview = ({ marketData }) => {
  if (!marketData) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Market Overview</h2>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center text-gray-500">Loading market data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Market Overview</h2>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Iron Ore Price */}
          <div className="text-center lg:text-left">
            <div className="border-b border-gray-200 pb-4 lg:border-b-0 lg:border-r lg:border-gray-200 lg:pr-8 lg:pb-0">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Iron Ore Price
              </h3>
              <div className="space-y-2">
                <div className="flex flex-col items-center lg:items-start">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${marketData.ironOre.price}
                    </span>
                    <span className="text-sm text-gray-600 font-medium">
                      /tonne CFR
                    </span>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium mt-2 ${
                    marketData.ironOre.changePercent >= 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <span className="mr-1">
                      {marketData.ironOre.changePercent >= 0 ? '↗' : '↘'}
                    </span>
                    {marketData.ironOre.changePercent >= 0 ? '+' : ''}{marketData.ironOre.changePercent}%
                  </div>
                </div>
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Source: {marketData.ironOre.source}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Major Miners */}
          <div className="text-center lg:text-left">
            <div className="border-b border-gray-200 pb-4 lg:border-b-0 lg:border-r lg:border-gray-200 lg:pr-8 lg:pb-0">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Major Miners (ASX)
              </h3>
              <div className="space-y-3">
                {marketData.companies.map((company, index) => (
                  <div key={index} className="flex justify-between items-center lg:justify-start lg:space-x-4">
                    <div className="flex-1 lg:flex-none">
                      <div className="text-sm font-semibold text-gray-900">
                        {company.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {company.ticker}
                      </div>
                    </div>
                    <div className="text-right lg:text-left lg:flex-1">
                      <div className="text-lg font-bold text-gray-900">
                        {company.price === 'Error' ? 'Error' : `$${company.price}`}
                      </div>
                      <div className={`text-xs font-medium ${
                        parseFloat(company.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {company.price === 'Error' ? 'N/A' : 
                          `${parseFloat(company.changePercent) >= 0 ? '+' : ''}${company.changePercent}%`
                        }
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Source: {marketData.companies[0]?.source || 'Yahoo Finance'}
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Key Indicators */}
          <div className="text-center lg:text-left">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Key Indicators
              </h3>
              <div className="space-y-3">
                {marketData.economicData.slice(0, 3).map((indicator, index) => (
                  <div key={index} className="flex justify-between items-center lg:justify-start lg:space-x-4">
                    <div className="flex-1 lg:flex-none">
                      <div className="text-sm font-semibold text-gray-900">
                        {indicator.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        Economic Indicator
                      </div>
                    </div>
                    <div className="text-right lg:text-left lg:flex-1">
                      <div className="text-lg font-bold text-gray-900">
                        {indicator.value}
                      </div>
                      <div className={`text-xs font-medium ${
                        indicator.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {indicator.trend === 'up' ? '↗' : '↘'} {indicator.change}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Source: ABS (Manual)
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
