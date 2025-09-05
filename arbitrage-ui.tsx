import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Calculator, RefreshCw, Settings, TrendingUp, DollarSign, Euro, Clock, Globe, ExternalLink, Play, Pause } from 'lucide-react';

// OpticOdds API data structure
const mockOpticOddsData = [
  {
    id: "2025020987911BC9",
    game_id: "13602-33320-25-05",
    start_date: "2025-09-06T15:00:00Z",
    home_competitors: [
      { id: "C921828AB706", name: "Manchester United", abbreviation: "MUN" }
    ],
    away_competitors: [
      { id: "2D71E5BA64A5", name: "Liverpool", abbreviation: "LIV" }
    ],
    home_team_display: "Manchester United",
    away_team_display: "Liverpool",
    status: "unplayed",
    is_live: false,
    sport: { id: "soccer", name: "Soccer" },
    league: { id: "premier_league", name: "Premier League" },
    odds: [
      {
        id: "odds1",
        sportsbook: "Pinnacle",
        market: "Moneyline",
        name: "Manchester United",
        selection: "Manchester United",
        price: 2.45,
        deep_link: {
          desktop: "https://pinnacle.com/betting/soccer/match/123456",
          ios: "pinnacle://bet/123456",
          android: "pinnacle://bet/123456"
        }
      },
      {
        id: "odds2", 
        sportsbook: "Bet365",
        market: "Moneyline",
        name: "Liverpool",
        selection: "Liverpool",
        price: 2.80,
        deep_link: {
          desktop: "https://bet365.com/betting/soccer/match/789012",
          ios: "bet365://bet/789012",
          android: "bet365://bet/789012"
        }
      },
      {
        id: "odds3",
        sportsbook: "William Hill", 
        market: "Moneyline",
        name: "Draw",
        selection: "Draw",
        price: 3.40,
        deep_link: {
          desktop: "https://williamhill.com/betting/soccer/match/345678",
          ios: "williamhill://bet/345678", 
          android: "williamhill://bet/345678"
        }
      }
    ],
    arbitrage: {
      profit: 4.23,
      total_stake: 1000,
      stakes: [
        { sportsbook: "Pinnacle", outcome: "Manchester United", stake: 408.16, odds: 2.45 },
        { sportsbook: "Bet365", outcome: "Liverpool", stake: 357.14, odds: 2.80 },
        { sportsbook: "William Hill", outcome: "Draw", stake: 294.12, odds: 3.40 }
      ]
    }
  },
  {
    id: "2025020987922BC9",
    game_id: "16341-33320-25-05", 
    start_date: "2025-09-06T20:30:00Z",
    home_competitors: [
      { id: "C921828AB706", name: "Los Angeles Lakers", abbreviation: "LAL" }
    ],
    away_competitors: [
      { id: "0787D09E47B9", name: "Boston Celtics", abbreviation: "BOS" }
    ],
    home_team_display: "Los Angeles Lakers",
    away_team_display: "Boston Celtics", 
    status: "unplayed",
    is_live: false,
    sport: { id: "basketball", name: "Basketball" },
    league: { id: "nba", name: "NBA" },
    odds: [
      {
        id: "odds4",
        sportsbook: "Pinnacle", 
        market: "Moneyline",
        name: "Lakers",
        selection: "Lakers",
        price: 1.95,
        deep_link: {
          desktop: "https://pinnacle.com/betting/basketball/match/111222",
          ios: "pinnacle://bet/111222",
          android: "pinnacle://bet/111222"
        }
      },
      {
        id: "odds5",
        sportsbook: "Bet365",
        market: "Moneyline", 
        name: "Celtics",
        selection: "Celtics",
        price: 2.10,
        deep_link: {
          desktop: "https://bet365.com/betting/basketball/match/333444",
          ios: "bet365://bet/333444",
          android: "bet365://bet/333444"
        }
      }
    ],
    arbitrage: {
      profit: 2.87,
      total_stake: 1000,
      stakes: [
        { sportsbook: "Pinnacle", outcome: "Lakers", stake: 512.82, odds: 1.95 },
        { sportsbook: "Bet365", outcome: "Celtics", stake: 476.19, odds: 2.10 }
      ]
    }
  }
];

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' }
];

const sports = ['All Sports', 'Soccer', 'Basketball', 'Tennis', 'Baseball', 'Hockey'];
const leagues = ['All Leagues', 'Premier League', 'NBA', 'US Open', 'MLB', 'NHL'];
const bookmakers = ['All Bookmakers', 'Pinnacle', 'Bet365', 'TAB', 'Sportsbet', 'Ladbrokes', 'Betfair'];

// 实时汇率Hook
function useExchangeRates() {
  const [rates, setRates] = useState({
    USD: 1,
    AUD: 1.52,
    EUR: 0.92
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        setRates({
          USD: 1,
          AUD: data.rates.AUD || 1.52,
          EUR: data.rates.EUR || 0.92
        });
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 3600000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  return { rates, isLoading };
}

// 使用实时数据 Hook
function useRealTimeArbitrage() {
  const [data, setData] = useState(mockOpticOddsData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/arbs');
      if (response.ok) {
        const result = await response.json();
        setData(result.arbitrages || mockOpticOddsData);
        setLastUpdate(new Date());
        setError(null);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching arbitrage data:', err);
      setData(mockOpticOddsData);
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startAutoRefresh = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    setIsAutoRefreshing(true);
    refresh();
    const newIntervalId = setInterval(refresh, 3000);
    setIntervalId(newIntervalId);
  }, [refresh, intervalId]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsAutoRefreshing(false);
  }, [intervalId]);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshing
  };
}

export default function ArbitrageUI() {
  const {
    data,
    isLoading: dataLoading,
    error,
    lastUpdate,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshing
  } = useRealTimeArbitrage();

  const { rates, isLoading: ratesLoading } = useExchangeRates();

  // 基础状态
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const [filters, setFilters] = useState({
    sport: 'All Sports',
    league: 'All Leagues', 
    bookmaker: 'All Bookmakers',
    minProfit: 0,
    maxProfit: 100
  });

  // 计算器相关状态
  const [selectedArb, setSelectedArb] = useState(null);
  const [totalStake, setTotalStake] = useState(200);
  const [individualStakes, setIndividualStakes] = useState({});
  const [riskAlert, setRiskAlert] = useState(null);
  
  // 功能开关状态
  const [showCommissions, setShowCommissions] = useState(false);
  const [commissions, setCommissions] = useState({});
  const [useOwnRates, setUseOwnRates] = useState(false);
  const [roundToNearest, setRoundToNearest] = useState(1);

  const handleCloseCalculator = () => {
    setSelectedArb(null);
    setIndividualStakes({});
    setRiskAlert(null);
    setCommissions({});
    setShowCommissions(false);
    setUseOwnRates(false);
  };

  // 检查套利风险
  const checkArbitrageRisk = useCallback((odds) => {
    if (!odds?.length) return;
    
    const decimalOdds = odds.map(odd => 
      typeof odd.price === 'number' ? odd.price : parseFloat(odd.price)
    );
    
    const totalImpliedProb = decimalOdds.reduce((sum, odd) => sum + (1 / odd), 0);
    
    if (totalImpliedProb >= 1) {
      setRiskAlert({
        type: 'danger',
        message: '⚠️ 警告：赔率已变化，不再是无风险套利！总隐含概率 > 100%'
      });
    } else if (totalImpliedProb > 0.98) {
      setRiskAlert({
        type: 'warning',
        message: '⚠️ 注意：利润空间很小，建议重新评估风险'
      });
    } else {
      setRiskAlert(null);
    }
  }, []);

  useEffect(() => {
    let filtered = data.filter(item => {
      if (filters.sport !== 'All Sports' && item.sport?.name !== filters.sport) return false;
      if (filters.league !== 'All Leagues' && item.league?.name !== filters.league) return false;
      if (filters.bookmaker !== 'All Bookmakers' && 
          !item.odds?.some(odd => odd.sportsbook === filters.bookmaker)) return false;
      if (item.arbitrage?.profit < filters.minProfit || item.arbitrage?.profit > filters.maxProfit) return false;
      return true;
    });
    setFilteredData(filtered);
  }, [data, filters]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && selectedArb) {
        handleCloseCalculator();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedArb]);

  // 监控选中套利的赔率变化
  useEffect(() => {
    if (selectedArb?.odds) {
      checkArbitrageRisk(selectedArb.odds);
    }
  }, [selectedArb, checkArbitrageRisk]);

  const calculateArbitrageStakes = (odds, totalAmount) => {
    if (!odds?.length) return [];
    
    const decimalOdds = odds.map(odd => ({
      ...odd,
      decimal_odds: typeof odd.price === 'number' ? odd.price : parseFloat(odd.price)
    }));

    const totalImpliedProb = decimalOdds.reduce((sum, odd) => sum + (1 / odd.decimal_odds), 0);
    
    return decimalOdds.map(odd => ({
      ...odd,
      stake: (totalAmount / odd.decimal_odds) / totalImpliedProb,
      potential_return: ((totalAmount / odd.decimal_odds) / totalImpliedProb) * odd.decimal_odds
    }));
  };

  const updateIndividualStake = (oddIndex, newStake) => {
    if (!selectedArb?.odds) return;
    
    const updatedStakes = { ...individualStakes };
    updatedStakes[oddIndex] = parseFloat(newStake) || 0;
    
    const targetOdd = selectedArb.odds[oddIndex];
    const targetReturn = updatedStakes[oddIndex] * targetOdd.price;
    
    selectedArb.odds.forEach((odd, index) => {
      if (index !== oddIndex) {
        updatedStakes[index] = targetReturn / odd.price;
      }
    });
    
    setIndividualStakes(updatedStakes);
    
    const newTotal = Object.values(updatedStakes).reduce((sum, stake) => sum + (stake || 0), 0);
    setTotalStake(newTotal);
  };

  useEffect(() => {
    if (selectedArb?.odds && Object.keys(individualStakes).length === 0) {
      const calculated = calculateArbitrageStakes(selectedArb.odds, totalStake);
      const stakes = {};
      calculated.forEach((calc, index) => {
        stakes[index] = calc.stake;
      });
      setIndividualStakes(stakes);
    }
  }, [selectedArb, totalStake, individualStakes]);

  useEffect(() => {
    if (selectedArb) {
      setIndividualStakes({});
      setTotalStake(200);
      setRiskAlert(null);
      setCommissions({});
      setShowCommissions(false);
    }
  }, [selectedArb?.id]);

  const formatCurrency = (amount) => {
    const rate = rates[selectedCurrency.code] || 1;
    return `${selectedCurrency.symbol}${(amount * rate).toFixed(2)}`;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeepLink = (deepLink) => {
    if (deepLink?.desktop) {
      window.open(deepLink.desktop, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-green-400">ArbWire Pro</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              {error && (
                <span className="text-red-400 ml-2">⚠ {error}</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCurrency.code}
              onChange={(e) => setSelectedCurrency(currencies.find(c => c.code === e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} ({currency.symbol})
                </option>
              ))}
            </select>
            
            <button
              onClick={isAutoRefreshing ? stopAutoRefresh : startAutoRefresh}
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
                isAutoRefreshing 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isAutoRefreshing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isAutoRefreshing ? 'Stop Auto (3s)' : 'Start Auto (3s)'}</span>
            </button>

            <button
              onClick={refresh}
              disabled={dataLoading}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-80 bg-gray-800 border-r border-gray-700 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sport</label>
                  <select
                    value={filters.sport}
                    onChange={(e) => setFilters({...filters, sport: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    {sports.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">League</label>
                  <select
                    value={filters.league}
                    onChange={(e) => setFilters({...filters, league: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    {leagues.map(league => (
                      <option key={league} value={league}>{league}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bookmaker</label>
                  <select
                    value={filters.bookmaker}
                    onChange={(e) => setFilters({...filters, bookmaker: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    {bookmakers.map(bookmaker => (
                      <option key={bookmaker} value={bookmaker}>{bookmaker}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Profit Range (%)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minProfit}
                      onChange={(e) => setFilters({...filters, minProfit: parseFloat(e.target.value) || 0})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxProfit}
                      onChange={(e) => setFilters({...filters, maxProfit: parseFloat(e.target.value) || 100})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Arbitrage Opportunities</h2>
              <div className="text-sm text-gray-400">
                {filteredData.length} opportunities found
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Event</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Market</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Profit %</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Best Odds</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredData.map((arb) => (
                    <tr key={arb.id} className="hover:bg-gray-750">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium">{arb.home_team_display} vs {arb.away_team_display}</div>
                          <div className="text-sm text-gray-400">{arb.league?.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {formatTime(arb.start_date)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {arb.odds?.[0]?.market || 'Moneyline'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200">
                          +{arb.arbitrage?.profit?.toFixed(2) || '0.00'}%
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {arb.odds?.slice(0, 3).map((odd, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-gray-300">{odd.sportsbook}</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono bg-gray-700 px-2 py-1 rounded text-xs">
                                  {typeof odd.price === 'number' ? odd.price.toFixed(2) : odd.price}
                                </span>
                                {odd.deep_link && (
                                  <button
                                    onClick={() => handleDeepLink(odd.deep_link)}
                                    className="text-blue-400 hover:text-blue-300"
                                    title="Open at bookmaker"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setSelectedArb(arb)}
                          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition-colors"
                        >
                          <Calculator className="w-4 h-4" />
                          <span>Calculate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {selectedArb && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseCalculator();
            }
          }}
        >
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Risk Alert Banner */}
            {riskAlert && (
              <div className={`px-6 py-3 text-center font-medium ${
                riskAlert.type === 'danger' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-yellow-600 text-black'
              }`}>
                {riskAlert.message}
              </div>
            )}

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold">{selectedArb.home_team_display} – {selectedArb.away_team_display}</h3>
                    <span className="text-2xl font-bold text-green-400">
                      {selectedArb.arbitrage?.profit?.toFixed(2) || '0.00'}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {selectedArb.sport?.name} / {selectedArb.league?.name}
                  </p>
                  <p className="text-sm text-blue-400 mt-1">
                    Market: {selectedArb.odds?.[0]?.market || 'Moneyline'} • Event in 1 day ({formatTime(selectedArb.start_date)})
                  </p>
                </div>
                <button
                  onClick={handleCloseCalculator}
                  className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700"
                >
                  ×
                </button>
              </div>

              {/* Table Header */}
              <div className="bg-gray-700 rounded-t-lg">
                <div className="grid grid-cols-7 gap-4 px-4 py-3 text-sm font-medium text-gray-300">
                  <div></div>
                  <div className="text-center">Odds</div>
                  <div className="text-center">{showCommissions ? 'With commission' : 'Original'}</div>
                  <div className="text-center">Stake</div>
                  <div className="text-center">D 🛡️</div>
                  <div className="text-center">F ⚡</div>
                  <div className="text-center">Profit</div>
                </div>
              </div>

              {/* Bet Rows */}
              <div className="bg-gray-750 border-l border-r border-gray-600">
                {selectedArb.odds?.map((odd, idx) => {
                  const currentStake = individualStakes[idx] || 0;
                  const commission = commissions[idx] || 0;
                  const effectiveOdds = showCommissions ? (odd.price - (odd.price - 1) * (commission / 100)) : odd.price;
                  const potentialReturn = currentStake * effectiveOdds;
                  const profit = potentialReturn - totalStake;

                  return (
                    <div key={idx} className="grid grid-cols-7 gap-4 px-4 py-3 border-b border-gray-600 items-center">
                      {/* Bookmaker */}
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 font-medium">{odd.sportsbook}</span>
                        <div className="text-xs text-gray-500">
                          <div>{odd.selection}</div>
                        </div>
                      </div>

                      {/* Odds */}
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <span className="font-mono text-lg font-semibold">
                            {typeof odd.price === 'number' ? odd.price.toFixed(3) : odd.price}
                          </span>
                          <button className="text-blue-400 hover:text-blue-300 text-xs">
                            📊
                          </button>
                          {odd.deep_link && (
                            <button
                              onClick={() => handleDeepLink(odd.deep_link)}
                              className="text-blue-400 hover:text-blue-300"
                              title="Open at bookmaker"
                            >
                              🔗
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Commission or Original Odds */}
                      <div className="text-center">
                        {showCommissions ? (
                          <div className="space-y-1">
                            <input
                              type="number"
                              value={commission}
                              onChange={(e) => setCommissions({...commissions, [idx]: parseFloat(e.target.value) || 0})}
                              className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-center w-16 text-sm"
                              placeholder="0.0%"
                              step="0.1"
                            />
                            <div className="text-xs text-gray-400">
                              {effectiveOdds.toFixed(3)}
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono text-sm">{odd.price.toFixed(3)}</span>
                        )}
                      </div>

                      {/* Stake with Currency Dropdown */}
                      <div className="text-center">
                        <div className="space-y-1">
                          <input
                            type="number"
                            value={currentStake.toFixed(2)}
                            onChange={(e) => updateIndividualStake(idx, e.target.value)}
                            className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-center font-mono w-20 text-sm"
                            step="0.01"
                          />
                          <select
                            value={selectedCurrency.code}
                            onChange={(e) => setSelectedCurrency(currencies.find(c => c.code === e.target.value))}
                            className="bg-gray-600 border border-gray-500 rounded px-1 py-1 text-xs w-16"
                          >
                            {currencies.map(currency => (
                              <option key={currency.code} value={currency.code}>
                                {currency.code}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* D Shield */}
                      <div className="text-center">
                        <input type="checkbox" className="w-4 h-4" defaultChecked />
                      </div>

                      {/* F Lightning */}
                      <div className="text-center">
                        <button className="w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-xs text-white">
                          ⚡
                        </button>
                      </div>

                      {/* Profit */}
                      <div className="text-center">
                        <div className="font-mono font-semibold text-green-400">
                          {formatCurrency(profit)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Total Stake Row */}
                <div className="grid grid-cols-7 gap-4 px-4 py-3 bg-gray-700 border-b border-gray-600 items-center font-medium">
                  <div className="flex items-center space-x-2">
                    <span>📊</span>
                    <span>Total stake:</span>
                  </div>
                  <div></div>
                  <div></div>
                  <div className="text-center">
                    <div className="space-y-1">
                      <input
                        type="number"
                        value={totalStake}
                        onChange={(e) => {
                          const newTotal = parseFloat(e.target.value) || 0;
                          setTotalStake(newTotal);
                          const calculated = calculateArbitrageStakes(selectedArb.odds, newTotal);
                          const stakes = {};
                          calculated.forEach((calc, index) => {
                            stakes[index] = calc.stake;
                          });
                          setIndividualStakes(stakes);
                        }}
                        className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-center font-mono w-20"
                      />
                      <select
                        value={selectedCurrency.code}
                        onChange={(e) => setSelectedCurrency(currencies.find(c => c.code === e.target.value))}
                        className="bg-gray-600 border border-gray-500 rounded px-1 py-1 text-xs w-16"
                      >
                        {currencies.map(currency => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-center">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                  </div>
                  <div className="text-center">
                    <button className="w-6 h-6 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center text-xs">
                      ⚙️
                    </button>
                  </div>
                  <div></div>
                </div>
              </div>

              {/* Options */}
              <div className="bg-gray-700 rounded-b-lg p-4 space-y-3">
                <div className="flex items-center space-x-6 text-sm">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4"
                      checked={showCommissions}
                      onChange={(e) => setShowCommissions(e.target.checked)}
                    />
                    <span>Show commissions</span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span>Round stakes up to nearest:</span>
                    <input
                      type="number"
                      value={roundToNearest}
                      onChange={(e) => setRoundToNearest(parseFloat(e.target.value) || 1)}
                      className="bg-gray-600 border border-gray-500 rounded px-2 py-1 w-16 text-center"
                      min="0.01"
                      step="0.01"
                    />
                  </label>
                </div>
                
                <div className="text-xs text-gray-400">
                  Take the currency exchange rates into account when rounding
                </div>

                {/* Commission Instructions */}
                {showCommissions && (
                  <div className="mt-3 p-3 bg-gray-600 rounded text-xs">
                    <div className="text-yellow-400 font-medium mb-2">Commission Settings:</div>
                    <div className="text-gray-300 space-y-1">
                      <div>• Enter commission percentage for each bookmaker (e.g., 5.0 for 5%)</div>
                      <div>• Commission is deducted from WINNINGS only (not from stake)</div>
                      <div>• Net odds = 1 + (Original odds - 1) × (1 - Commission%)</div>
                      <div>• Common rates: Betfair 5-6%, Traditional books 0-2%</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400">Total Investment</div>
                  <div className="text-lg font-bold">{formatCurrency(totalStake)}</div>
                </div>
                <div className="bg-green-900 bg-opacity-50 rounded p-3">
                  <div className="text-xs text-gray-400">Guaranteed Profit</div>
                  <div className="text-lg font-bold text-green-400">
                    {formatCurrency(totalStake * ((selectedArb.arbitrage?.profit || 0) / 100))}
                  </div>
                </div>
                <div className="bg-blue-900 bg-opacity-50 rounded p-3">
                  <div className="text-xs text-gray-400">Profit Margin</div>
                  <div className="text-lg font-bold text-blue-400">
                    {selectedArb.arbitrage?.profit?.toFixed(2) || '0.00'}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}