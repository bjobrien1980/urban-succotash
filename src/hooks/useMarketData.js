import { useState, useCallback } from 'react';

export const useMarketData = () => {
  const [isSearching, setIsSearching] = useState(false);
  
  // Enhanced market data state with more comprehensive economic indicators
  const [marketData, setMarketData] = useState({
    ironOre: {
      price: 'Loading...',
      changePercent: 0,
      source: 'Loading...'
    },
    companies: [
      { name: 'BHP Group', ticker: 'BHP.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' },
      { name: 'Rio Tinto', ticker: 'RIO.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' },
      { name: 'Fortescue', ticker: 'FMG.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' }
    ],
    economicData: [
      { 
        label: 'CPI', 
        value: '3.4%', 
        change: '+0.2%', 
        trend: 'up', 
        source: 'ABS (Manual)',
        description: 'Consumer Price Index - Inflation Rate',
        category: 'inflation',
        impact: 'negative', // Rising inflation generally negative for mining
        lastUpdated: '2025-01-15'
      },
      { 
        label: 'WA Unemployment', 
        value: '3.8%', 
        change: '-0.1%', 
        trend: 'down', 
        source: 'ABS (Manual)',
        description: 'Western Australia Unemployment Rate',
        category: 'employment',
        impact: 'positive', // Falling unemployment is positive
        lastUpdated: '2025-01-15'
      },
      { 
        label: 'AUD/USD', 
        value: '0.6785', 
        change: '+0.0045', 
        trend: 'up', 
        source: 'Manual',
        description: 'Australian Dollar Exchange Rate',
        category: 'currency',
        impact: 'mixed', // Stronger AUD can hurt exports but indicates economic strength
        lastUpdated: '2025-01-20'
      },
      {
        label: 'China Manufacturing PMI',
        value: '50.2',
        change: '+0.8',
        trend: 'up',
        source: 'Manual',
        description: 'China Manufacturing Purchasing Managers Index',
        category: 'demand',
        impact: 'positive', // Higher Chinese manufacturing = more iron ore demand
        lastUpdated: '2025-01-15'
      },
      {
        label: 'Baltic Dry Index',
        value: '1,247',
        change: '-23',
        trend: 'down',
        source: 'Manual',
        description: 'Shipping Costs for Dry Bulk Commodities',
        category: 'logistics',
        impact: 'mixed', // Lower shipping costs good for margins, but might indicate weak demand
        lastUpdated: '2025-01-18'
      },
      {
        label: 'Steel Production (China)',
        value: '87.2M tonnes',
        change: '+2.1%',
        trend: 'up',
        source: 'Manual',
        description: 'Monthly Chinese Steel Production',
        category: 'demand',
        impact: 'positive', // More steel production = more iron ore demand
        lastUpdated: '2025-01-10'
      }
    ]
  });

  // Function to fetch iron ore price from text file
  const fetchIronOrePrice = async () => {
    try {
      console.log('Fetching iron ore price from file...');
      const response = await fetch('/data/iron-ore-price.txt');
      const text = await response.text();
      
      const lines = text.trim().split('\n').filter(line => line.trim());
      
      if (lines.length >= 2) {
        // Parse current and previous prices
        const [currentDate, currentPriceStr] = lines[0].split(',');
        const [previousDate, previousPriceStr] = lines[1].split(',');
        
        const currentPrice = parseFloat(currentPriceStr);
        const previousPrice = parseFloat(previousPriceStr);
        
        // Calculate percentage change
        const changePercent = ((currentPrice - previousPrice) / previousPrice * 100);
        
        console.log(`Iron ore: Current $${currentPrice}, Previous $${previousPrice}, Change ${changePercent.toFixed(2)}%`);
        
        return {
          price: currentPrice.toFixed(2),
          changePercent: changePercent.toFixed(2),
          source: `Market Index (Updated ${currentDate})`
        };
      } else if (lines.length === 1) {
        // Only one entry, no change calculation
        const [currentDate, currentPriceStr] = lines[0].split(',');
        const currentPrice = parseFloat(currentPriceStr);
        
        return {
          price: currentPrice.toFixed(2),
          changePercent: '0.00',
          source: `Market Index (Updated ${currentDate})`
        };
      } else {
        throw new Error('No price data found');
      }
    } catch (error) {
      console.error('Error fetching iron ore price:', error);
      return {
        price: 'Error',
        changePercent: '0.00',
        source: 'File Error'
      };
    }
  };

  // Function to fetch stock data from Yahoo Finance
  const fetchStockData = async () => {
    try {
      console.log('Fetching stock data...');
      const stockSymbols = ['BHP.AX', 'RIO.AX', 'FMG.AX'];
      
      const stockPromises = stockSymbols.map(async symbol => {
        try {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)}`;
          const response = await fetch(proxyUrl);
          const proxyData = await response.json();
          return JSON.parse(proxyData.contents);
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
          return null;
        }
      });
      
      const stockResults = await Promise.all(stockPromises);
      console.log('Stock results:', stockResults);
      
      const companies = stockResults.map((result, index) => {
        try {
          if (!result || !result.chart || !result.chart.result || !result.chart.result[0]) {
            throw new Error('Invalid API response structure');
          }

          const data = result.chart.result[0];
          const currentPrice = data.meta.regularMarketPrice;
          const previousClose = data.meta.previousClose;
          
          if (currentPrice === undefined || previousClose === undefined) {
            throw new Error('Missing price data');
          }

          const change = ((currentPrice - previousClose) / previousClose * 100);
          
          const names = ['BHP Group', 'Rio Tinto', 'Fortescue'];
          return {
            name: names[index],
            ticker: stockSymbols[index],
            price: currentPrice.toFixed(2),
            changePercent: change.toFixed(2),
            source: 'Yahoo Finance (Live)'
          };
        } catch (error) {
          console.error(`Error processing ${stockSymbols[index]}:`, error);
          const names = ['BHP Group', 'Rio Tinto', 'Fortescue'];
          return {
            name: names[index],
            ticker: stockSymbols[index],
            price: 'Error',
            changePercent: '0.00',
            source: 'API Error'
          };
        }
      });

      console.log('Processed companies:', companies);
      return companies;

    } catch (error) {
      console.error('Error fetching stock data:', error);
      return null;
    }
  };

  // Function to fetch real-time AUD/USD exchange rate
  const fetchExchangeRate = async () => {
    try {
      // Using a free exchange rate API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/AUD');
      const data = await response.json();
      
      if (data && data.rates && data.rates.USD) {
        const currentRate = data.rates.USD;
        
        // For demo purposes, calculate a mock change (in real app, store previous rate)
        const mockPreviousRate = currentRate * 0.998; // Assume small positive change
        const change = currentRate - mockPreviousRate;
        const changePercent = (change / mockPreviousRate) * 100;
        
        return {
          label: 'AUD/USD',
          value: currentRate.toFixed(4),
          change: `${change >= 0 ? '+' : ''}${change.toFixed(4)}`,
          trend: change >= 0 ? 'up' : 'down',
          source: 'Exchange Rate API (Live)',
          description: 'Australian Dollar Exchange Rate',
          category: 'currency',
          impact: 'mixed',
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      
      throw new Error('Invalid exchange rate data');
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Return current static data on error
      return null;
    }
  };

  // Helper function to calculate overall market sentiment
  const calculateMarketSentiment = (ironOre, companies, economicData) => {
    let positiveFactors = 0;
    let totalFactors = 0;

    // Iron ore price impact
    if (parseFloat(ironOre.changePercent) > 0) positiveFactors += 1;
    totalFactors += 1;

    // Company performance
    companies.forEach(company => {
      if (company.price !== 'Error' && parseFloat(company.changePercent) > 0) {
        positiveFactors += 1;
      }
      totalFactors += 1;
    });

    // Economic indicators with weighted impact
    economicData.forEach(indicator => {
      if (indicator.impact === 'positive' && indicator.trend === 'up') {
        positiveFactors += 1;
      } else if (indicator.impact === 'negative' && indicator.trend === 'down') {
        positiveFactors += 1;
      } else if (indicator.impact === 'mixed') {
        positiveFactors += 0.5;
      }
      totalFactors += 1;
    });

    return {
      score: Math.round((positiveFactors / totalFactors) * 100),
      positiveFactors,
      totalFactors
    };
  };

  // Main refresh function
  const refreshMarketData = useCallback(async () => {
    setIsSearching(true);
    try {
      // Fetch iron ore price, stock data, and exchange rate
      const [ironOreData, companiesData, exchangeRateData] = await Promise.all([
        fetchIronOrePrice(),
        fetchStockData(),
        fetchExchangeRate()
      ]);

      setMarketData(prev => {
        // Update exchange rate if successfully fetched
        let updatedEconomicData = [...prev.economicData];
        if (exchangeRateData) {
          const audUsdIndex = updatedEconomicData.findIndex(item => item.label === 'AUD/USD');
          if (audUsdIndex !== -1) {
            updatedEconomicData[audUsdIndex] = exchangeRateData;
          }
        }

        const newData = {
          ironOre: ironOreData,
          companies: companiesData || prev.companies.map(company => ({
            ...company,
            price: 'Error',
            changePercent: '0.00',
            source: 'API Failed'
          })),
          economicData: updatedEconomicData
        };

        // Calculate and log market sentiment
        const sentiment = calculateMarketSentiment(newData.ironOre, newData.companies, newData.economicData);
        console.log('Market Sentiment:', sentiment);

        return newData;
      });

    } catch (error) {
      console.error('Error refreshing market data:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Helper function to get indicators by category
  const getIndicatorsByCategory = useCallback((category) => {
    return marketData.economicData.filter(indicator => indicator.category === category);
  }, [marketData.economicData]);

  // Helper function to get critical indicators (those with significant impact)
  const getCriticalIndicators = useCallback(() => {
    return marketData.economicData.filter(indicator => 
      indicator.impact === 'positive' || indicator.impact === 'negative'
    );
  }, [marketData.economicData]);

  return {
    marketData,
    isSearching,
    refreshMarketData,
    getIndicatorsByCategory,
    getCriticalIndicators,
    marketSentiment: calculateMarketSentiment(
      marketData.ironOre, 
      marketData.companies, 
      marketData.economicData
    )
  };
};
