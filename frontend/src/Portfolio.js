// Portfolio.js
import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { MarketDataContext } from "./components/MarketDataContext";
import { ArrowUpRight, ArrowDownRight, RefreshCw, TrendingUp, ChevronDown, ChevronUp, 
  AlertTriangle, Clock, DollarSign, BarChart2, PieChart as PieChartIcon, 
  Activity, Menu, X, Calendar, Filter } from "lucide-react";
import "./portfolio.css";

const COLORS = ["#00c853", "#ff5252", "#ffab00", "#64ffda", "#d500f9", "#00e676", "#2979ff", "#f50057"];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = ((data.value / total) * 100).toFixed(2);
    return (
      <div className="custom-tooltip">
        <p className="label">{data.name}</p>
        <p className="value">${data.value.toFixed(2)}</p>
        <p className="percent">{percentage}% of portfolio</p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload, totalValue }) => {
  return (
    <ul className="custom-legend">
      {payload.map((entry, index) => {
        const percentage = ((entry.payload.value / totalValue) * 100).toFixed(1);
        return (
          <li key={`item-${index}`} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: entry.color }}></div>
            <span className="legend-text">
              {entry.value} - ${entry.payload.value.toFixed(2)} ({percentage}%)
            </span>
          </li>
        );
      })}
    </ul>
  );
};

// Mock data for performance chart
const generatePerformanceData = (days = 30, startValue = 10000) => {
  const data = [];
  let currentValue = startValue;
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate some random fluctuation
    const change = Math.random() * 200 - 100;
    currentValue += change;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: currentValue,
    });
  }
  
  return data;
};

const Portfolio = ({ user }) => {
  const [portfolio, setPortfolio] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBarData, setSortBarData] = useState("desc");
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("1M");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [performanceData, setPerformanceData] = useState(() => generatePerformanceData());
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    minValue: 0,
    maxValue: 10000,
    dateRange: "all",
    orderType: "all"
  });
  
  const wsPortfolio = useRef(null);
  const navigate = useNavigate();
  const marketData = useContext(MarketDataContext);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Function to fetch portfolio data from backend REST endpoint.
  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/portfolio?email=${user.email}`);
      if (!res.ok) {
        throw new Error("Failed to fetch portfolio data");
      }
      const data = await res.json();
      setPortfolio(data.portfolio);
      
      // Regenerate performance data on refresh for demo purposes
      setPerformanceData(generatePerformanceData());
    } catch (err) {
      console.error(err);
      setError("Failed to load portfolio. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [user.email]);

  // Setup WebSocket for full portfolio updates.
  useEffect(() => {
    const wsUrl = `ws://127.0.0.1:8000/ws_portfolio?email=${user.email}`;
    wsPortfolio.current = new WebSocket(wsUrl);

    wsPortfolio.current.onopen = () => {
      console.log("Portfolio WebSocket connected.");
    };

    wsPortfolio.current.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);
        if (messageData.portfolio) {
          setPortfolio(messageData.portfolio);
        }
      } catch (error) {
        console.error("Error parsing portfolio WebSocket message:", error);
      }
    };

    wsPortfolio.current.onerror = (err) => {
      console.error("Portfolio WebSocket error:", err);
    };

    wsPortfolio.current.onclose = () => {
      console.log("Portfolio WebSocket closed.");
    };

    return () => {
      if (wsPortfolio.current) {
        wsPortfolio.current.close();
      }
    };
  }, [user.email]);

  // Update portfolio using common market data.
  useEffect(() => {
    if (portfolio && portfolio.positions && marketData) {
      const updatedPositions = portfolio.positions.map((pos) => {
        const newData = marketData[pos.symbol];
        if (newData && newData.price) {
          const newPrice = newData.price;
          const prevPrice = pos.currentPrice || pos.avgCost;
          const change = (newPrice - prevPrice) / prevPrice * 100;
          return {
            ...pos,
            currentPrice: newPrice,
            marketValue: pos.quantity * newPrice,
            change: change
          };
        }
        return pos;
      });
      const totalPositionsValue = updatedPositions.reduce((sum, pos) => sum + pos.marketValue, 0);
      const totalAccountValue = portfolio.cash + totalPositionsValue;
      const totalProfitLoss = totalAccountValue - portfolio.baseBalance;

      setPortfolio({
        ...portfolio,
        positions: updatedPositions,
        totalPositionsValue,
        totalAccountValue,
        totalProfitLoss,
      });
    }
  }, [marketData, portfolio]);

  // Optional: polling to refresh portfolio on a timer (e.g., every 5 seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchPortfolio();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [user.email]);

  const toggleBarSort = () => {
    setSortBarData(sortBarData === "desc" ? "asc" : "desc");
  };
  
  const toggleFilter = () => {
    setFilterOpen(!filterOpen);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };
  
  const applyFilters = (e) => {
    e.preventDefault();
    // This would filter the actual data in a real implementation
    console.log("Applying filters:", filters);
    setFilterOpen(false);
  };

  if (loading) {
    return (
      <div className="portfolio-loading-container">
        <div className="loading-animation">
          <div className="loading-circle"></div>
          <div className="loading-circle"></div>
          <div className="loading-circle"></div>
        </div>
        <div className="loading-text">Loading portfolio...</div>
      </div>
    );
  }
  
  if (error) return <div className="portfolio-error">{error}</div>;
  if (!portfolio) return <div className="portfolio-empty">No portfolio data available.</div>;

  const pieData = portfolio.positions
    ? portfolio.positions.map((pos) => ({
        name: pos.symbol,
        value: pos.marketValue,
      }))
    : [];
  const totalMarketValue = pieData.reduce((sum, item) => sum + item.value, 0);

  const tradeVolume = {};
  if (portfolio.orders) {
    portfolio.orders.forEach((order) => {
      const sym = order.symbol.toUpperCase();
      if (!tradeVolume[sym]) tradeVolume[sym] = 0;
      tradeVolume[sym] += order.quantity;
    });
  }
  let barData = Object.entries(tradeVolume).map(([symbol, volume]) => ({
    symbol,
    volume,
  }));
  barData = barData.sort((a, b) =>
    sortBarData === "desc" ? b.volume - a.volume : a.volume - b.volume
  );

  const profitLossData = portfolio.positions
    ? portfolio.positions.map((pos) => {
        const costBasis = pos.quantity * pos.avgCost;
        const currentValue = pos.quantity * pos.currentPrice;
        const profitLoss = currentValue - costBasis;
        return {
          name: pos.symbol,
          value: profitLoss,
          fill: profitLoss >= 0 ? "#00c853" : "#ff5252",
        };
      })
    : [];
    
  // Calculate rate of return
  const portfolio12MonthReturn = ((portfolio.totalAccountValue - portfolio.baseBalance) / portfolio.baseBalance * 100).toFixed(2);

  // Get top performers
  const topPerformers = [...portfolio.positions].sort((a, b) => {
    const aReturn = (a.currentPrice - a.avgCost) / a.avgCost;
    const bReturn = (b.currentPrice - b.avgCost) / b.avgCost;
    return bReturn - aReturn;
  }).slice(0, 3);
  
  // Get underperformers
  const underPerformers = [...portfolio.positions].sort((a, b) => {
    const aReturn = (a.currentPrice - a.avgCost) / a.avgCost;
    const bReturn = (b.currentPrice - b.avgCost) / b.avgCost;
    return aReturn - bReturn;
  }).slice(0, 3);

  return (
    <div className="portfolio-page">
      <nav className="navbar">
        <div className="navbar-logo">
          Bearhood
        </div>
        
        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className={`navbar-items ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="navbar-links">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <a href="/portfolio" className="nav-link active">Portfolio</a>
          </div>
          
          <div className="navbar-user">
            {user && (
              <span className="user-greeting">
                Welcome, {user.email.split("@")[0]}
              </span>
            )}
            <button 
              className="logout-button" 
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "..." : "Logout"}
            </button>
          </div>
        </div>
      </nav>

      <main className="portfolio-main">
        <div className="portfolio-header">
          <h1>Your Portfolio</h1>
          <div className="last-updated">
            <Clock size={14} />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        
        {/* Portfolio Tabs */}
        <div className="portfolio-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`} 
            onClick={() => setActiveTab('overview')}
          >
            <PieChartIcon size={16} />
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'positions' ? 'active' : ''}`} 
            onClick={() => setActiveTab('positions')}
          >
            <BarChart2 size={16} />
            Positions
          </button>
          <button 
            className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`} 
            onClick={() => setActiveTab('performance')}
          >
            <TrendingUp size={16} />
            Performance
          </button>
          <button 
            className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`} 
            onClick={() => setActiveTab('orders')}
          >
            <Activity size={16} />
            Orders
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Account Summary Section */}
            <section className="portfolio-summary">
              <div className="summary-header">
                <h2>Account Summary</h2>
                <button className="refresh-button" onClick={fetchPortfolio}>
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
              
              <div className="summary-cards">
                <div className="summary-card">
                  <span className="card-label">Base Amount</span>
                  <span className="card-value">${portfolio.baseBalance.toFixed(2)}</span>
                </div>
                <div className="summary-card">
                  <span className="card-label">Cash Available</span>
                  <span className="card-value">${portfolio.cash.toFixed(2)}</span>
                </div>
                <div className="summary-card">
                  <span className="card-label">Positions Value</span>
                  <span className="card-value">${portfolio.totalPositionsValue.toFixed(2)}</span>
                </div>
                <div className="summary-card">
                  <span className="card-label">Account Value</span>
                  <span className="card-value">${portfolio.totalAccountValue.toFixed(2)}</span>
                </div>
                <div className="summary-card highlight">
                  <span className="card-label">Profit/Loss</span>
                  <div className="card-value-wrapper">
                    <span className="card-value" style={{ color: portfolio.totalProfitLoss >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                      ${portfolio.totalProfitLoss.toFixed(2)}
                    </span>
                    <span className="change-indicator" style={{ backgroundColor: portfolio.totalProfitLoss >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                      {portfolio.totalProfitLoss >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs((portfolio.totalProfitLoss / portfolio.baseBalance * 100)).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Quick Insights */}
            <section className="quick-insights">
              <h2>Quick Insights</h2>
              <div className="insights-grid">
                <div className="insight-card">
                  <h3>12-Month Return</h3>
                  <div className="insight-value" style={{ color: portfolio12MonthReturn >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                    {portfolio12MonthReturn}%
                  </div>
                  <div className="insight-desc">
                    {portfolio12MonthReturn >= 0 ? "Outperforming" : "Underperforming"} the market by {Math.abs(portfolio12MonthReturn - 8.4).toFixed(2)}%
                  </div>
                </div>
                
                <div className="insight-card">
                  <h3>Cash Allocation</h3>
                  <div className="insight-value">
                    {(portfolio.cash / portfolio.totalAccountValue * 100).toFixed(2)}%
                  </div>
                  <div className="insight-desc">
                    {(portfolio.cash / portfolio.totalAccountValue * 100) > 20 ? "Consider investing more" : "Well invested"}
                  </div>
                </div>
                
                <div className="insight-card">
                  <h3>Diversification</h3>
                  <div className="insight-value">
                    {portfolio.positions.length} Stocks
                  </div>
                  <div className="insight-desc">
                    {portfolio.positions.length < 5 ? "Consider adding more stocks" : "Well diversified"}
                  </div>
                </div>
                
                <div className="insight-card">
                  <h3>Trading Activity</h3>
                  <div className="insight-value">
                    {portfolio.orders ? portfolio.orders.length : 0} Orders
                  </div>
                  <div className="insight-desc">
                    {portfolio.orders && portfolio.orders.length > 10 ? "Active trader" : "Long-term investor"}
                  </div>
                </div>
              </div>
            </section>
            
            {/* Portfolio Distribution Chart */}
            <section className="portfolio-charts">
              <div className="chart-container">
                <div className="chart-header">
                  <h2>Portfolio Distribution</h2>
                </div>
                
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={380}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        fill="#00c853"
                        paddingAngle={2}
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip content={<CustomTooltip total={totalMarketValue} />} />
                      <Legend
                        content={<CustomLegend totalValue={totalMarketValue} />}
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="no-data">No positions to display in chart.</p>
                )}
              </div>
            </section>
            
            {/* Top Performers */}
            <div className="performance-grid">
              <section className="performers-section">
                <h2>Top Performers</h2>
                <div className="performers-list">
                  {topPerformers.map((pos, index) => (
                    <div key={`top-${index}`} className="performer-card">
                      <div className="performer-symbol">{pos.symbol}</div>
                      <div className="performer-value">
                        <span className="value-amount">${pos.currentPrice.toFixed(2)}</span>
                        <span className="change-percentage positive">
                          <ArrowUpRight size={14} />
                          {((pos.currentPrice - pos.avgCost) / pos.avgCost * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              
              <section className="performers-section">
                <h2>Underperformers</h2>
                <div className="performers-list">
                  {underPerformers.map((pos, index) => (
                    <div key={`under-${index}`} className="performer-card">
                      <div className="performer-symbol">{pos.symbol}</div>
                      <div className="performer-value">
                        <span className="value-amount">${pos.currentPrice.toFixed(2)}</span>
                        <span className="change-percentage negative">
                          <ArrowDownRight size={14} />
                          {Math.abs((pos.currentPrice - pos.avgCost) / pos.avgCost * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
        
        {activeTab === 'positions' && (
          <>
            <section className="portfolio-positions">
              <div className="section-header">
                <h2>Current Positions</h2>
                <div className="section-actions">
                  <button className="action-button">
                    <Filter size={14} /> Filter
                  </button>
                  <button className="action-button" onClick={fetchPortfolio}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>
              
              {portfolio.positions && portfolio.positions.length > 0 ? (
                <div className="positions-table-wrapper">
                  <table className="positions-table modern">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Quantity</th>
                        <th>Avg Cost</th>
                        <th>Current Price</th>
                        <th>Change</th>
                        <th>Market Value</th>
                        <th>P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.positions.map((pos) => {
                        const profitLoss = (pos.currentPrice - pos.avgCost) * pos.quantity;
                        const profitLossPercent = ((pos.currentPrice - pos.avgCost) / pos.avgCost) * 100;
                        return (
                          <tr key={pos.symbol} className="position-row">
                            <td className="symbol-cell">{pos.symbol}</td>
                            <td>{pos.quantity}</td>
                            <td>${pos.avgCost.toFixed(2)}</td>
                            <td>${pos.currentPrice.toFixed(2)}</td>
                            <td>
                              <span className={`change-pill ${pos.change >= 0 ? 'positive' : 'negative'}`}>
                                {pos.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {Math.abs(pos.change).toFixed(2)}%
                              </span>
                            </td>
                            <td className="value-cell">${(pos.quantity * pos.currentPrice).toFixed(2)}</td>
                            <td className={`pl-cell ${profitLoss >= 0 ? 'positive' : 'negative'}`}>
                              <div>${profitLoss.toFixed(2)}</div>
                              <div className="percent-change">
                                {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <DollarSign size={48} />
                  <p>No active positions available.</p>
                  <button className="primary-button">Start Trading</button>
                </div>
              )}
            </section>
            
            <section className="portfolio-details-charts">
              {/* Profit/Loss by Position Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <h2>Profit/Loss by Position</h2>
                </div>
                
                {profitLossData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={profitLossData}
                      margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00e676" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#00c853" stopOpacity={0.6} />
                        </linearGradient>
                        <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff5252" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#ff1744" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#aaa" />
                      <YAxis stroke="#aaa" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                      <ReTooltip formatter={(value) => [`$${value.toFixed(2)}`, "Profit/Loss"]} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {profitLossData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.value >= 0 ? "url(#profitGradient)" : "url(#lossGradient)"} 
                          />
                        ))}
                        <LabelList dataKey="value" position="top" formatter={(value) => `$${value.toFixed(0)}`} fill="#fff" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="no-data">No profit/loss data available.</p>
                )}
              </div>
            </section>
          </>
        )}
        
        {activeTab === 'performance' && (
          <>
            <section className="portfolio-performance">
              <div className="section-header">
                <h2>Portfolio Performance</h2>
                <div className="time-range-selector">
                  <button className={`range-button ${timeRange === '1W' ? 'active' : ''}`} onClick={() => setTimeRange('1W')}>1W</button>
                  <button className={`range-button ${timeRange === '1M' ? 'active' : ''}`} onClick={() => setTimeRange('1M')}>1M</button>
                  <button className={`range-button ${timeRange === '3M' ? 'active' : ''}`} onClick={() => setTimeRange('3M')}>3M</button>
                  <button className={`range-button ${timeRange === '1Y' ? 'active' : ''}`} onClick={() => setTimeRange('1Y')}>1Y</button>
                  <button className={`range-button ${timeRange === 'ALL' ? 'active' : ''}`} onClick={() => setTimeRange('ALL')}>ALL</button>
                </div>
              </div>
                
              <div className="performance-chart">
              <ResponsiveContainer width="100%" height={400}>
                  <AreaChart
                    data={performanceData}
                    margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00c853" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00c853" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#aaa" 
                      tick={{ fill: "#aaa" }} 
                      tickLine={{ stroke: "#444" }}
                    />
                    <YAxis 
                      stroke="#aaa" 
                      tickFormatter={(value) => `$${value.toFixed(0)}`} 
                      tick={{ fill: "#aaa" }} 
                      tickLine={{ stroke: "#444" }}
                    />
                    <ReTooltip 
                      formatter={(value) => [`$${value.toFixed(2)}`, "Portfolio Value"]}
                      contentStyle={{ backgroundColor: "#1e1e1e", border: "1px solid #444" }}
                      labelStyle={{ color: "#aaa" }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#00c853" 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="performance-metrics">
                <div className="metric-card">
                  <span className="metric-label">Starting Value</span>
                  <span className="metric-value">${performanceData[0].value.toFixed(2)}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Current Value</span>
                  <span className="metric-value">${performanceData[performanceData.length - 1].value.toFixed(2)}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Change</span>
                  <span className="metric-value" style={{ color: performanceData[performanceData.length - 1].value - performanceData[0].value >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                    ${(performanceData[performanceData.length - 1].value - performanceData[0].value).toFixed(2)}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Return</span>
                  <span className="metric-value" style={{ color: (performanceData[performanceData.length - 1].value - performanceData[0].value) / performanceData[0].value >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                    {(((performanceData[performanceData.length - 1].value - performanceData[0].value) / performanceData[0].value) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="insights-section">
                <h3>Performance Insights</h3>
                <div className="insights-container">
                  <div className="insight-item">
                    <div className="insight-icon positive">
                      <TrendingUp size={20} />
                    </div>
                    <div className="insight-content">
                      <h4>Positive Trend</h4>
                      <p>Your portfolio has grown by {(((performanceData[performanceData.length - 1].value - performanceData[0].value) / performanceData[0].value) * 100).toFixed(2)}% over the selected period.</p>
                    </div>
                  </div>
                  
                  <div className="insight-item">
                    <div className="insight-icon">
                      <BarChart2 size={20} />
                    </div>
                    <div className="insight-content">
                      <h4>Volatility Analysis</h4>
                      <p>Your portfolio shows moderate volatility compared to market benchmarks.</p>
                    </div>
                  </div>
                  
                  <div className="insight-item">
                    <div className="insight-icon">
                      <Calendar size={20} />
                    </div>
                    <div className="insight-content">
                      <h4>Key Events</h4>
                      <p>Major market events during this period affected your performance.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
        
        {activeTab === 'orders' && (
          <>
            <section className="portfolio-orders">
              <div className="section-header">
                <h2>Order History</h2>
                <div className="section-actions">
                  <button className="action-button" onClick={toggleFilter}>
                    <Filter size={14} /> Filter
                  </button>
                </div>
              </div>
              
              {filterOpen && (
                <div className="filter-panel">
                  <form onSubmit={applyFilters}>
                    <div className="filter-grid">
                      <div className="filter-group">
                        <label>Min Value ($)</label>
                        <input 
                          type="number" 
                          name="minValue" 
                          value={filters.minValue}
                          onChange={handleFilterChange}
                        />
                      </div>
                      
                      <div className="filter-group">
                        <label>Max Value ($)</label>
                        <input 
                          type="number" 
                          name="maxValue" 
                          value={filters.maxValue}
                          onChange={handleFilterChange}
                        />
                      </div>
                      
                      <div className="filter-group">
                        <label>Date Range</label>
                        <select name="dateRange" value={filters.dateRange} onChange={handleFilterChange}>
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                          <option value="quarter">This Quarter</option>
                          <option value="year">This Year</option>
                        </select>
                      </div>
                      
                      <div className="filter-group">
                        <label>Order Type</label>
                        <select name="orderType" value={filters.orderType} onChange={handleFilterChange}>
                          <option value="all">All Types</option>
                          <option value="buy">Buy</option>
                          <option value="sell">Sell</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="filter-actions">
                      <button type="button" className="cancel-button" onClick={toggleFilter}>Cancel</button>
                      <button type="submit" className="apply-button">Apply Filters</button>
                    </div>
                  </form>
                </div>
              )}
              
              {portfolio.orders && portfolio.orders.length > 0 ? (
                <div className="orders-table-wrapper">
                  <table className="orders-table modern">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Symbol</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.orders.map((order, idx) => (
                        <tr key={idx} className={`order-row ${order.action.toLowerCase()}`}>
                          <td className="date-cell">{order.date}</td>
                          <td>
                            <span className={`action-pill ${order.action.toLowerCase()}`}>
                              {order.action}
                            </span>
                          </td>
                          <td className="symbol-cell">{order.symbol}</td>
                          <td>{order.quantity}</td>
                          <td>${order.price.toFixed(2)}</td>
                          <td className="total-cell">${order.total.toFixed(2)}</td>
                          <td>
                            <span className="status-pill completed">
                              Completed
                            </span>
                          </td>
                          <td className="message-cell">{order.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <Activity size={48} />
                  <p>No order history available.</p>
                  <button className="primary-button">Place First Order</button>
                </div>
              )}
              
              {/* Trading Volume Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <h3>
                    Trading Volume per Symbol
                    <button onClick={toggleBarSort} className="sort-button">
                      {sortBarData === "desc" ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                  </h3>
                </div>
                
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, barData.length * 40)}>
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{ top: 5, right: 50, left: 50, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#00c853" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#64ffda" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis type="number" stroke="#aaa" />
                      <YAxis dataKey="symbol" type="category" stroke="#aaa" width={60} />
                      <ReTooltip formatter={(value) => [`${value} shares`, "Volume"]} />
                      <Bar dataKey="volume" fill="url(#barGradient)" radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="volume" position="right" fill="#fff" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="no-data">No trading volume data available.</p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      
      <div className="portfolio-footer">
        <span>© 2025 Bearhood. All rights reserved.</span>
        <div className="footer-links">
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Help Center</a>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;