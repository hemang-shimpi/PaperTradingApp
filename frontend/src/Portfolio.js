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
} from "recharts";
import { MarketDataContext } from "./components/MarketDataContext";
import "./portfolio.css";

const COLORS = ["#00c853", "#ff5252", "#ffab00", "#64ffda", "#d500f9", "#00e676"];
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

const Portfolio = ({ user }) => {
  const [portfolio, setPortfolio] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBarData, setSortBarData] = useState("desc");
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
          return {
            ...pos,
            currentPrice: newPrice,
            marketValue: pos.quantity * newPrice,
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

  if (loading) return <div className="portfolio-loading">Loading portfolio...</div>;
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

  return (
    <div className="portfolio-page">
      <nav className="navbar">
        <div className="navbar-logo">Bearhood</div>
        <div className="navbar-items">
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
            <button className="logout-button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "..." : "Logout"}
            </button>
          </div>
        </div>
      </nav>

      <main className="portfolio-main">
        {/* Account Summary Section */}
        <section className="portfolio-summary">
          <h2>Account Summary</h2>
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
            <div className="summary-card">
              <span className="card-label">Profit/Loss</span>
              <span className="card-value" style={{ color: portfolio.totalProfitLoss >= 0 ? "limegreen" : "red" }}>
                ${portfolio.totalProfitLoss.toFixed(2)}
              </span>
            </div>
          </div>
          <button className="refresh-button" onClick={fetchPortfolio}>
            Refresh Portfolio
          </button>
        </section>

        {/* Positions Section */}
        <section className="portfolio-positions">
          <h2>Current Positions</h2>
          {portfolio.positions && portfolio.positions.length > 0 ? (
            <table className="positions-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Avg Cost</th>
                  <th>Current Price</th>
                  <th>Market Value</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((pos) => (
                  <tr key={pos.symbol}>
                    <td>{pos.symbol}</td>
                    <td>{pos.quantity}</td>
                    <td>${pos.avgCost.toFixed(2)}</td>
                    <td>${pos.currentPrice.toFixed(2)}</td>
                    <td>${(pos.quantity * pos.currentPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No active positions available.</p>
          )}
        </section>

        {/* Order History Section */}
        <section className="portfolio-orders">
          <h2>Order History</h2>
          {portfolio.orders && portfolio.orders.length > 0 ? (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.orders.map((order, idx) => (
                  <tr key={idx}>
                    <td>{order.date}</td>
                    <td>{order.action}</td>
                    <td>{order.symbol}</td>
                    <td>{order.quantity}</td>
                    <td>${order.price.toFixed(2)}</td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>{order.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No order history available.</p>
          )}
        </section>

        {/* Charts Section */}
        <section className="portfolio-charts">
          <h2>Portfolio Charts</h2>
          
          {/* Pie Chart - Positions Distribution */}
          <div className="chart-wrapper">
            <h3>Positions Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
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
      
          {/* Bar Chart - Trading Volume per Symbol */}
          <div className="chart-wrapper">
            <h3>
              Trading Volume per Symbol
              <button onClick={toggleBarSort} className="sort-button">
                Sort {sortBarData === "desc" ? "▼" : "▲"}
              </button>
            </h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(300, barData.length * 40)}>
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#aaa" />
                  <YAxis dataKey="symbol" type="category" stroke="#aaa" width={60} />
                  <ReTooltip formatter={(value) => [`${value} shares`, "Volume"]} />
                  <Legend />
                  <Bar dataKey="volume" fill="#00c853">
                    {barData.map((entry, index) => {
                      const max = Math.max(...barData.map((d) => d.volume));
                      const ratio = entry.volume / max;
                      const intensity = Math.floor(255 * (1 - ratio));
                      return (
                        <Cell key={`cell-${index}`} fill={`rgb(0, ${200 - intensity}, ${83 - intensity/3})`} />
                      );
                    })}
                    <LabelList dataKey="volume" position="right" fill="#fff" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">No trading volume data available.</p>
            )}
          </div>
      
          {/* Profit/Loss by Position Chart */}
          <div className="chart-wrapper">
            <h3>Profit/Loss by Position</h3>
            {profitLossData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={profitLossData}
                  margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#aaa" />
                  <YAxis stroke="#aaa" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                  <ReTooltip formatter={(value) => [`$${value.toFixed(2)}`, "Profit/Loss"]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {profitLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
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
      </main>
    </div>
  );
};

export default Portfolio;