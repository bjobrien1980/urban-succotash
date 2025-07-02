// 1. CREATE FILE: public/data/iron-ore-price.txt
// Format: date,price (one entry per line, newest first)
// Example content:
/*
2025-01-27,119.80
2025-01-20,121.20
2025-01-13,118.45
2025-01-06,116.90
*/

// 2. UPDATE useMarketData.js - Replace the hardcoded iron ore section

import { useState, useCallback } from 'react';

export const useMarketData = () => {
  const [isSearching, setIsSearching] = useState(false);
  
  // Initial market data state
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
      { label: 'CPI', value: '3.4%', change: '+0.2%', trend: 'up', source: 'ABS (Manual)' },
      { label: 'WA Unemp', value: '3.8%', change: '-0.1%', trend: 'down', source: 'ABS (Manual)' },
      { label: 'AUD/USD', value: '0.6785', change: '+0.0045', trend: 'up', source: 'Manual' }
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

  // Main refresh function
  const refreshMarketData = useCallback(async () => {
    setIsSearching(true);
    try {
      // Fetch both iron ore price and stock data
      const [ironOreData, companiesData] = await Promise.all([
        fetchIronOrePrice(),
        fetchStockData()
      ]);

      setMarketData(prev => ({
        ironOre: ironOreData,
        companies: companiesData || prev.companies.map(company => ({
          ...company,
          price: 'Error',
          changePercent: '0.00',
          source: 'API Failed'
        })),
        economicData: prev.economicData
      }));

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
