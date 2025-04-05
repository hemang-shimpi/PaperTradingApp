import React, { useState, useEffect } from "react";
import TradeBox from "./TradeBox";
import "../index.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const stockOptions = {
  AAPL: "Apple Inc.",
  META: "Meta Platforms Inc.",
  TSLA: "Tesla Inc.",
  GOOG: "Alphabet Inc. (Class C)",
  NFLX: "Netflix Inc.",
  GOOGL: "Alphabet Inc. (Class A)",
  WMT: "Walmart Inc.",
  AMD: "Advanced Micro Devices",
  AMZN: "Amazon.com Inc.",
  MSFT: "Microsoft Corporation",
  NVDA: "NVIDIA Corporation",
  DIS: "The Walt Disney Company",
  KO: "The Coca-Cola Company",
  PLTR: "Palantir Technologies Inc."
};

function StockTrade() {
  // Original state for selected stock and timeline
  const [selectedStock, setSelectedStock] = useState("AAPL");
  const [activeTimeline, setActiveTimeline] = useState("1D");

  // Additional state variables
  const [priceHistory, setPriceHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [livePrice, setLivePrice] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPrice, setHoverPrice] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);

  // Fetch historical price data based on the selected stock and timeline
  useEffect(() => {
    const fetchHistorical = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/historical?ticker=${selectedStock}&period=${activeTimeline}`
        );
        const data = await res.json();
        const mapped = data.map(item => {
          const dateObj = new Date(item.date);
          const label =
            activeTimeline === "1D" || activeTimeline === "1W"
              ? dateObj.toLocaleString("en-US", {
                  month: "short", 
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit"
                })
              : dateObj.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                });
          return {
            rawDate: dateObj,
            time: label,
            price: parseFloat(item.close)
          };
        });
        setPriceHistory(mapped);
      } catch (err) {
        console.error("Historical fetch error:", err);
      }
    };
    fetchHistorical();
  }, [selectedStock, activeTimeline]);

  // Set up a WebSocket connection for live updates
  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws");
    socket.onmessage = (event) => {
      const allData = JSON.parse(event.data);
      const selectedData = allData[selectedStock];
      if (selectedData) {
        setStats(selectedData);
        setLivePrice(selectedData.price);
      }
    };
    return () => socket.close();
  }, [selectedStock]);

  // Derived variables for display using hovered value when available
  const displayPrice = livePrice !== null ? livePrice : 223.41;
  const effectivePrice = (isHovering && hoverPrice != null) ? hoverPrice : displayPrice;
  const firstPoint = priceHistory.length > 0 ? priceHistory[0].price : displayPrice;
  const rawChange = effectivePrice - firstPoint;
  const percentChange = firstPoint !== 0 ? (rawChange / firstPoint) * 100 : 0;
  const isPositiveChange = rawChange >= 0;
  const changeColor = isPositiveChange ? "#39FF14" : "#FF4500";

  // Helper function to format large numbers (e.g., Market Cap, Volume)
  const formatLargeNumber = (num) => {
    if (typeof num !== "number") return "--";
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const timelineOptions = ["1D", "1W", "1M", "6M", "YTD", "1Y", "5Y", "MAX"];

  return (
    <div className="stock-trade-page">
      <div className="main-content">
        {/* LEFT COLUMN */}
        <div className="stock-info">
          {/* Top Section: Header & Chart */}
          <div className="top-section">
            <div className="header-container">
              <div className="stock-header">
                <h1 className="stock-title">
                  {selectedStock} ({stockOptions[selectedStock]})
                </h1>
                <h2 className="stock-price">
                  ${effectivePrice.toFixed(2)}
                </h2>
                {isHovering && hoverDate && (
                  <p className="hover-date-time">{hoverDate}</p>
                )}
                <p className="stock-change" style={{ color: changeColor }}>
                  {isPositiveChange
                    ? `+$${Math.abs(rawChange).toFixed(2)} (+${Math.abs(percentChange).toFixed(2)}%)`
                    : `-$${Math.abs(rawChange).toFixed(2)} (-${Math.abs(percentChange).toFixed(2)}%)`}
                </p>
              </div>
              <div className="ticker-dropdown-top">
                <select
                  className="ticker-select"
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                >
                  {Object.entries(stockOptions).map(([symbol, name]) => (
                    <option key={symbol} value={symbol}>
                      {symbol} - {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={priceHistory}
                  onMouseMove={(e) => {
                    if (e.activePayload && e.activePayload.length > 0) {
                      setIsHovering(true);
                      setHoverPrice(e.activePayload[0].value);
                      setHoverDate(e.activePayload[0].payload.time);
                    }
                  }}
                  onMouseLeave={() => {
                    setIsHovering(false);
                    setHoverPrice(null);
                    setHoverDate(null);
                  }}
                >
                  <XAxis dataKey="time" stroke="transparent" tick={false} />
                  <YAxis
                    stroke="transparent"
                    tick={false}
                    domain={([min, max]) => {
                      const padding = (max - min) * 0.1 || 1;
                      return [min - padding, max + padding];
                    }}
                  />
                  <Tooltip contentStyle={{ display: "none" }} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={rawChange != null ? (rawChange >= 0 ? "#00ff00" : "#ff0000") : "gray"}
                    strokeWidth={2}
                    dot={{ r: 0 }}
                    activeDot={{ r: 4, fill: rawChange >= 0 ? "#00ff00" : "#ff0000" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Section: Timeline & Key Stats */}
          <div className="bottom-section">
            <div className="timeline-container">
              {timelineOptions.map((option) => (
                <button
                  key={option}
                  className={`timeline-btn ${
                    activeTimeline === option ? "active" : ""
                  }`}
                  onClick={() => setActiveTimeline(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <hr className="divider" />
            <div className="key-stats-section">
              <h3 className="key-stats-title">Key statistics</h3>
              <div className="stats-cards">
                <div className="stat-card">
                  <span>Market Cap</span>
                  <span>{formatLargeNumber(stats.marketCap)}</span>
                </div>
                <div className="stat-card">
                  <span>P/E Ratio</span>
                  <span>{stats.peRatio?.toFixed(2)}</span>
                </div>
                <div className="stat-card">
                  <span>Avg Volume</span>
                  <span>{formatLargeNumber(stats.averageVolume)}</span>
                </div>
                <div className="stat-card">
                  <span>Volume</span>
                  <span>{formatLargeNumber(stats.volume)}</span>
                </div>
                <div className="stat-card">
                  <span>High Today</span>
                  <span>${stats.high?.toFixed(2) || "--"}</span>
                </div>
                <div className="stat-card">
                  <span>Low Today</span>
                  <span>${stats.low?.toFixed(2) || "--"}</span>
                </div>
                <div className="stat-card">
                  <span>52W High</span>
                  <span>${stats["52WeekHigh"]?.toFixed(2) || "--"}</span>
                </div>
                <div className="stat-card">
                  <span>52W Low</span>
                  <span>${stats["52WeekLow"]?.toFixed(2) || "--"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Trade Box */}
        <div className="trade-box-wrapper">
          <TradeBox stockSymbol={selectedStock} />
        </div>
      </div>
    </div>
  );
}

export default StockTrade;
