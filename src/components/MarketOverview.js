import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';

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

  // Calculate market health score based on indicators
  const calculateMarketHealth = () => {
    let score = 0;
    let totalIndicators = 0;

    // Iron ore price trend
    if (marketData.ironOre.changePercent >= 0) score += 1;
    totalIndicators += 1;

    // Company performance
    marketData.companies.forEach(company => {
      if (company.price !== 'Error' && parseFloat(company.changePercent) >= 0) {
        score += 1;
      }
      totalIndicators += 1;
    });

    // Economic indicators
    marketData.economicData.forEach(indicator => {
      if (indicator.trend === 'up' && (indicator.label === 'CPI' || indicator.label === 'AUD/USD')) {
        score += 0.5; // Mixed impact for these
      } else if (indicator.trend === 'down' && indicator.label === 'WA Unemp') {
        score += 1; // Unemployment down is good
      } else if (indicator.trend === 'up' && indicator.label !== 'CPI') {
        score += 1; // Generally up trends are good except CPI
      }
      totalIndicators += 1;
    });

    return Math.round((score / totalIndicators) * 100);
  };

  const marketHealthScore = calculateMarketHealth();
  
  // Get health status
  const getHealthStatus = (score) => {
    if (score >= 70) return { status: 'Strong', color: 'green', icon: TrendingUp };
    if (score >= 40) return { status: 'Moderate', color: 'yellow', icon: BarChart3 };
    return { status: 'Weak', color: 'red', icon: TrendingDown };
  };

  const healthStatus = getHealthStatus(marketHealthScore);

  // Get icon for indicator type
  const getIndicatorIcon = (label) => {
    if (label.includes('CPI')) return '📊';
    if (label.includes('Unemp')) return '👥';
    if (label.includes('AUD')) return '💱';
    return '📈';
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Market Overview</h2>
        <div className="flex items-center space-x-2">
          <healthStatus.icon className={`w-5 h-5 text-${healthStatus.color}-600`} />
          <span className={`text-sm font-medium text-${healthStatus.color}-600`}>
            Market Health: {healthStatus.status} ({marketHealthScore}%)
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Iron Ore Price - Enhanced */}
          <div className="text-center lg:text-left">
            <div className="border-b border-gray-200 pb-4 lg:border-b-0 lg:border-r lg:border-gray-200 lg:pr-8 lg:pb-0">
              <div className="flex items-center justify-center lg:justify-start space-x-2 mb-3">
                <DollarSign className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Iron Ore Price
                </h3>
              </div>
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
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                    marketData.ironOre.changePercent >= 0 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {marketData.ironOre.changePercent >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {marketData.ironOre.changePercent >= 0 ? '+' : ''}{marketData.ironOre.changePercent}%
                  </div>
                </div>
                
                {/* Price impact indicator */}
                <div className="mt-3 p-2 bg-gray-50 rounded-md">
                  <div className="text-xs font-medium text-gray-700">Impact Assessment</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {parseFloat(marketData.ironOre.changePercent) > 5 ? "🔥 Significant price movement" :
                     parseFloat(marketData.ironOre.changePercent) > 2 ? "📈 Notable price change" :
                     parseFloat(marketData.ironOre.changePercent) > -2 ? "➡️ Stable pricing" :
                     parseFloat(marketData.ironOre.changePercent) > -5 ? "📉 Moderate decline" :
                     "⚠️ Major price drop"}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Source: {marketData.ironOre.source}
                </div>
                
                {/* Explanatory content for Iron Ore Price */}
                <div className="mt-4 p-3 bg-orange-50 rounded-md border border-orange-100">
                  <h4 className="text-xs font-semibold text-orange-800 mb-2">Understanding Iron Ore Pricing</h4>
                  <div className="space-y-2 text-xs text-orange-700">
                    <p><strong>CFR:</strong> Cost and Freight - price includes shipping to Chinese ports</p>
                    <p><strong>Benchmark:</strong> 62% Fe content fines, the global standard for iron ore quality</p>
                    <p><strong>Impact:</strong> Higher prices boost WA miner revenues and regional employment</p>
                    <p><strong>Drivers:</strong> Chinese steel demand, supply disruptions, economic growth</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Major Miners - Enhanced */}
          <div className="text-center lg:text-left">
            <div className="border-b border-gray-200 pb-4 lg:border-b-0 lg:border-r lg:border-gray-200 lg:pr-8 lg:pb-0">
              <div className="flex items-center justify-center lg:justify-start space-x-2 mb-3">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Major Miners (ASX)
                </h3>
              </div>
              <div className="space-y-3">
                {marketData.companies.map((company, index) => (
                  <div key={index} className="flex justify-between items-center lg:justify-start lg:space-x-4 p-2 rounded-md hover:bg-gray-50 transition-colors">
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
                        {company.price === 'Error' ? (
                          <span className="text-red-500 text-sm">Error</span>
                        ) : (
                          `$${company.price}`
                        )}
                      </div>
                      <div className={`text-xs font-medium flex items-center ${
                        parseFloat(company.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {company.price === 'Error' ? (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        ) : parseFloat(company.changePercent) >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {company.price === 'Error' ? 'N/A' : 
                          `${parseFloat(company.changePercent) >= 0 ? '+' : ''}${company.changePercent}%`
                        }
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Sector performance summary */}
                <div className="mt-3 p-2 bg-blue-50 rounded-md">
                  <div className="text-xs font-medium text-blue-700">Sector Performance</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {(() => {
                      const validCompanies = marketData.companies.filter(c => c.price !== 'Error');
                      if (validCompanies.length === 0) return "Data unavailable";
                      
                      const positiveCount = validCompanies.filter(c => parseFloat(c.changePercent) >= 0).length;
                      const percentage = Math.round((positiveCount / validCompanies.length) * 100);
                      
                      return `${positiveCount}/${validCompanies.length} companies up (${percentage}%)`;
                    })()}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Source: {marketData.companies[0]?.source || 'Yahoo Finance'}
                </div>
                
                {/* Explanatory content for Major Miners */}
                <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                  <h4 className="text-xs font-semibold text-blue-800 mb-2">WA Iron Ore Giants</h4>
                  <div className="space-y-2 text-xs text-blue-700">
                    <p><strong>BHP Group:</strong> World's largest mining company, Pilbara operations include Mt Whaleback</p>
                    <p><strong>Rio Tinto:</strong> Major Pilbara producer, operates multiple mines and rail infrastructure</p>
                    <p><strong>Fortescue:</strong> Third-largest iron ore producer, significant WA employer and exporter</p>
                    <p><strong>Market Impact:</strong> These companies drive WA's economy and employment in mining regions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Key Indicators - Significantly Enhanced */}
          <div className="text-center lg:text-left">
            <div>
              <div className="flex items-center justify-center lg:justify-start space-x-2 mb-3">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Key Economic Indicators
                </h3>
              </div>
              <div className="space-y-3">
                {marketData.economicData.map((indicator, index) => (
                  <div key={index} className="p-3 rounded-md border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{getIndicatorIcon(indicator.label)}</span>
                          <div className="text-sm font-semibold text-gray-900">
                            {indicator.label}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {indicator.label.includes('CPI') ? 'Inflation Rate' :
                           indicator.label.includes('Unemp') ? 'Unemployment' :
                           indicator.label.includes('AUD') ? 'Exchange Rate' :
                           'Economic Indicator'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {indicator.value}
                        </div>
                        <div className={`text-xs font-medium flex items-center justify-end ${
                          indicator.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {indicator.trend === 'up' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {indicator.change}
                        </div>
                      </div>
                    </div>
                    
                    {/* Impact assessment for each indicator */}
                    <div className="mt-2 text-xs text-gray-600">
                      {indicator.label.includes('CPI') && indicator.trend === 'up' && "⚠️ Rising inflation pressure" ||
                       indicator.label.includes('CPI') && indicator.trend === 'down' && "✅ Easing inflation" ||
                       indicator.label.includes('Unemp') && indicator.trend === 'down' && "✅ Improving employment" ||
                       indicator.label.includes('Unemp') && indicator.trend === 'up' && "⚠️ Rising unemployment" ||
                       indicator.label.includes('AUD') && indicator.trend === 'up' && "💪 Strengthening AUD" ||
                       indicator.label.includes('AUD') && indicator.trend === 'down' && "📉 Weakening AUD" ||
                       "📊 Monitoring trend"}
                    </div>
                  </div>
                ))}
                
                {/* Overall economic sentiment */}
                <div className="mt-4 p-3 bg-purple-50 rounded-md border border-purple-100">
                  <div className="text-xs font-medium text-purple-700 mb-1">Economic Outlook</div>
                  <div className="text-xs text-purple-600">
                    {(() => {
                      const upTrends = marketData.economicData.filter(i => i.trend === 'up').length;
                      const totalIndicators = marketData.economicData.length;
                      const ratio = upTrends / totalIndicators;
                      
                      if (ratio >= 0.67) return "🔸 Generally positive economic conditions";
                      if (ratio >= 0.33) return "🔸 Mixed economic signals";
                      return "🔸 Economic headwinds present";
                    })()}
                  </div>
                </div>
                
                {/* Explanatory content for Key Indicators */}
                <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-800 mb-2">Why These Indicators Matter</h4>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p><strong>CPI:</strong> Rising inflation can pressure interest rates and economic growth</p>
                    <p><strong>WA Unemployment:</strong> Lower unemployment indicates strong regional mining employment</p>
                    <p><strong>AUD/USD:</strong> Weaker AUD makes Australian exports more competitive globally</p>
                    <p><strong>China PMI:</strong> Above 50 indicates expanding manufacturing, driving iron ore demand</p>
                    <p><strong>Baltic Dry:</strong> Shipping costs affect the final delivered price of iron ore</p>
                    <p><strong>Steel Production:</strong> Higher Chinese steel output directly increases iron ore consumption</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Source: ABS (Manual)
                </div>
              </div>
            </div>
          </div>
          
        </div>
        
        {/* New: Overall Market Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Market Summary</h4>
                <p className="text-xs text-gray-600">
                  Combined analysis of iron ore pricing, miner performance, and economic indicators
                </p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  marketHealthScore >= 70 ? 'text-green-600' :
                  marketHealthScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {marketHealthScore}%
                </div>
                <div className="text-xs text-gray-500">Health Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
