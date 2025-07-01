import { useState, useCallback } from 'react';

export const useMarketData = () => {
  const [isSearching, setIsSearching] = useState(false);
  
  // Initial market data state
  const [marketData, setMarketData] = useState({
    ironOre: {
      price: 118.45,
      changePercent: +2.42,
      source: 'Manual Update'
    },
    companies: [
      { name: 'BHP Group', ticker: 'BHP.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' },
      { name: 'Rio Tinto', ticker: 'RIO.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' },
      { name: 'Fortescue', ticker: 'FMG.AX', price: 'Loading...', changePercent: '0.00', source: 'Loading...' }
    ],
    economicData: [
      { label: 'CPI', value: '3.4%', change: '+0.2%', trend: 'up', source: 'ABS (Manual)' },
      { label: 'WA Unemp', value: '3.8%', change: '-0.1%', trend: 'down', source: 'ABS (Manual)' },
      { label: 'AUD/USD', value: '0.6785', change: '+0.0045', trend: 'up', source: 'Manual' }
    ]
  });

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
      
      setMarketData(prev => ({
        ironOre: {
          price: 118.45,
          changePercent: +2.42,
          source: 'Manual Update'
        },
        companies: companies,
        economicData: prev.economicData
      }));

    } catch (error) {
      console.error('Error fetching market data:', error);
      
      // Set error state for all companies
      setMarketData(prev => ({
        ...prev,
        companies: prev.companies.map(company => ({
          ...company,
          price: 'Error',
          changePercent: '0.00',
          source: 'API Failed'
        }))
      }));
    }
  };

  // Main refresh function
  const refreshMarketData = useCallback(async () => {
    setIsSearching(true);
    try {
      await fetchStockData();
    } catch (error) {
      console.error('Error refreshing market data:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    marketData,
    isSearching,
    refreshMarketData
  };
};
