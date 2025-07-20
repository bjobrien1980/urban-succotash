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
      { label: 'CPI', value: 'Loading...', change: 'Loading...', trend: 'up', source: 'Loading...' },
      { label: 'WA Unemp', value: 'Loading...', change: 'Loading...', trend: 'down', source: 'Loading...' },
      { label: 'AUD/USD', value: 'Loading...', change: 'Loading...', trend: 'up', source: 'Loading...' },
      { label: 'China PMI', value: 'Loading...', change: 'Loading...', trend: 'up', source: 'Loading...' },
      { label: 'Baltic Dry', value: 'Loading...', change: 'Loading...', trend: 'down', source: 'Loading...' },
      { label: 'Steel Prod', value: 'Loading...', change: 'Loading...', trend: 'up', source: 'Loading...' }
    ]
  });

  // Generic function to fetch data from text files
  const fetchDataFromFile = async (filename, valueFormatter = (val) => val, suffix = '') => {
    try {
      console.log(`Fetching data from ${filename}...`);
      const response = await fetch(`/data/${filename}`);
      const text = await response.text();
      
      const lines = text.trim().split('\n').filter(line => line.trim());
      
      if (lines.length >= 2) {
        // Parse current and previous values
        const [currentDate, currentValueStr] = lines[0].split(',').map(s => s.trim());
        const [previousDate, previousValueStr] = lines[1].split(',').map(s => s.trim());
        
        const currentValue = parseFloat(currentValueStr);
        const previousValue = parseFloat(previousValueStr);
        
        // Calculate change and percentage change
        const change = currentValue - previousValue;
        const changePercent = ((currentValue - previousValue) / previousValue * 100);
        
        console.log(`${filename}: Current ${currentValue}, Previous ${previousValue}, Change ${changePercent.toFixed(2)}%`);
        
        return {
          value: valueFormatter(currentValue) + suffix,
          change: `${change >= 0 ? '+' : ''}${valueFormatter(change)}${suffix}`,
          changePercent: changePercent.toFixed(2),
          trend: change >= 0 ? 'up' : 'down',
          source: `Manual (Updated ${currentDate})`
        };
      } else if (lines.length === 1) {
        // Only one entry, no change calculation
        const [currentDate, currentValueStr] = lines[0].split(',').map(s => s.trim());
        const currentValue = parseFloat(currentValueStr);
        
        return {
          value: valueFormatter(currentValue) + suffix,
          change: '0.00' + suffix,
          changePercent: '0.00',
          trend: 'up',
          source: `Manual (Updated ${currentDate})`
        };
      } else {
        throw new Error('No data found');
      }
    } catch (error) {
      console.error(`Error fetching ${filename}:`, error);
      return {
        value: 'Error',
        change: 'Error',
        changePercent: '0.00',
        trend: 'up',
        source: 'File Error'
      };
    }
  };

  // Function to fetch iron ore price from text file
  const fetchIronOrePrice = async () => {
    try {
      console.log('Fetching iron ore price from file...');
      const response = await fetch('/data/iron-ore-price.txt');
      const text = await response.text();
      
      const lines = text.trim().split('\n').filter(line => line.trim());
      
      if (lines.length >= 2) {
        // Parse current and previous prices
        const [currentDate, currentPriceStr] = lines[0].split(',').map(s => s.trim());
        const [previousDate, previousPriceStr] = lines[1].split(',').map(s => s.trim());
        
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
        const [currentDate, currentPriceStr] = lines[0].split(',').map(s => s.trim());
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

  // Function to fetch all economic indicators from files
  const fetchEconomicData = async () => {
    try {
      const [cpiData, unemploymentData, audUsdData, chinaPmiData, balticData, steelData] = await Promise.all([
        fetchDataFromFile('cpi-data.txt', (val) => val.toFixed(1), '%'),
        fetchDataFromFile('wa-unemployment.txt', (val) => val.toFixed(1), '%'),
        fetchDataFromFile('aud-usd.txt', (val) => val.toFixed(4)),
        fetchDataFromFile('china-pmi.txt', (val) => val.toFixed(1)),
        fetchDataFromFile('baltic-dry-index.txt', (val) => val.toLocaleString()),
        fetchDataFromFile('steel-production.txt', (val) => val.toFixed(1), 'M tonnes')
      ]);

      return [
        { label: 'CPI', ...cpiData },
        { label: 'WA Unemp', ...unemploymentData },
        { label: 'AUD/USD', ...audUsdData },
        { label: 'China PMI', ...chinaPmiData },
        { label: 'Baltic Dry', ...balticData },
        { label: 'Steel Prod', ...steelData }
      ];
    } catch (error) {
      console.error('Error fetching economic data:', error);
      return [
        { label: 'CPI', value: 'Error', change: 'Error', trend: 'up', source: 'File Error' },
        { label: 'WA Unemp', value: 'Error', change: 'Error', trend: 'down', source: 'File Error' },
        { label: 'AUD/USD', value: 'Error', change: 'Error', trend: 'up', source: 'File Error' },
        { label: 'China PMI', value: 'Error', change: 'Error', trend: 'up', source: 'File Error' },
        { label: 'Baltic Dry', value: 'Error', change: 'Error', trend: 'down', source: 'File Error' },
        { label: 'Steel Prod', value: 'Error', change: 'Error', trend: 'up', source: 'File Error' }
      ];
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
      // Fetch iron ore price, stock data, and economic indicators
      const [ironOreData, companiesData, economicData] = await Promise.all([
        fetchIronOrePrice(),
        fetchStockData(),
        fetchEconomicData()
      ]);

      setMarketData(prev => ({
        ironOre: ironOreData,
        companies: companiesData || prev.companies.map(company => ({
          ...company,
          price: 'Error',
          changePercent: '0.00',
          source: 'API Failed'
        })),
        economicData: economicData
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
