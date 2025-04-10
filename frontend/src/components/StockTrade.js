import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

const StockTrade = ({ stockSymbol = "AAPL", stockName = "Apple Inc.", isTradeBoxOpen }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [priceHistory, setPriceHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [livePrice, setLivePrice] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPrice, setHoverPrice] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const [chartType, setChartType] = useState("line");
  const [marketStatus, setMarketStatus] = useState("Closed"); // Default to Closed

  useEffect(() => {
    const fetchHistorical = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/historical?ticker=${stockSymbol}&period=${selectedTimeframe}`);
        const data = await res.json();
        const mapped = data.map(item => {
          const dateObj = new Date(item.date);
          const label =
            selectedTimeframe === "1D" || selectedTimeframe === "1W"
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
  }, [stockSymbol, selectedTimeframe]);

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws");
    socket.onmessage = (event) => {
      const allData = JSON.parse(event.data);
      const selectedData = allData[stockSymbol];
      if (selectedData) {
        setStats(selectedData);
        setLivePrice(selectedData.price);
        
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const day = now.getDay();
        
        // Check if it's a weekend (0 = Sunday, 6 = Saturday)
        if (day === 0 || day === 6) {
          setMarketStatus("Closed");
        } else {
          // Convert to Eastern Time (assuming local time is being used)
          // This is a simplified approach. For production, use a timezone library
          const timeInMinutes = hours * 60 + minutes;
          
          if (timeInMinutes < 4 * 60) {
            setMarketStatus("Night"); // Midnight to 4:00 AM ET
          } else if (timeInMinutes < 9 * 60 + 30) {
            setMarketStatus("Pre-market"); // 4:00 AM to 9:30 AM ET
          } else if (timeInMinutes < 16 * 60) {
            setMarketStatus("Market Open"); // 9:30 AM to 4:00 PM ET
          } else if (timeInMinutes < 20 * 60) {
            setMarketStatus("After-hours"); // 4:00 PM to 8:00 PM ET
          } else {
            setMarketStatus("Night"); // After 8:00 PM ET
          }
        }
      }
    };
    return () => socket.close();
  }, [stockSymbol]);

  const formatLargeNumber = (num) => {
    if (typeof num !== "number") return "--";
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const displayPrice = isHovering && hoverPrice != null ? hoverPrice : livePrice;
  const displayDate = isHovering && hoverDate ? hoverDate : null;

  const firstPoint = priceHistory.length > 0 ? priceHistory[0].price : null;
  const rawChange = firstPoint != null && displayPrice != null ? displayPrice - firstPoint : null;
  const percentChange = rawChange && firstPoint ? (rawChange / firstPoint) * 100 : null;
  const isPositive = rawChange >= 0;

  const formattedChange = rawChange != null
    ? `${rawChange >= 0 ? "+" : "-"}$${Math.abs(rawChange).toFixed(2)}`
    : "--";

  const formattedPercent = percentChange != null
    ? `${rawChange >= 0 ? "+" : "-"}${Math.abs(percentChange).toFixed(2)}%`
    : "--";

  // Get min and max for chart
  const minPrice = priceHistory.length > 0 
    ? Math.min(...priceHistory.map((item) => item.price)) 
    : 0;
  const maxPrice = priceHistory.length > 0 
    ? Math.max(...priceHistory.map((item) => item.price))
    : 0;

  const chartColor = isPositive ? "#00c853" : "#ff5252";
  const chartGradientStart = isPositive ? "rgba(0, 200, 83, 0.8)" : "rgba(255, 82, 82, 0.8)";
  const chartGradientEnd = isPositive ? "rgba(0, 200, 83, 0.1)" : "rgba(255, 82, 82, 0.1)";

  const getStatusColor = (status) => {
    switch(status) {
      case "Day": return "#00c853"; // Green for active trading
      case "Before": return "#2196f3"; // Blue for pre-market
      case "After": return "#ff9800"; // Orange for after-hours
      case "Night": return "#673ab7"; // Purple for night
      case "Closed": return "#757575"; // Grey for closed
      default: return "#757575";
    }
  };

  return (
    <div className={`stock-container ${isTradeBoxOpen ? "trade-box-open" : ""}`}>
      <div className="stock-header">
        <div className="stock-title">
          <h1>
            {stockSymbol} <span className="stock-name">({stockName})</span>
          </h1>
        </div>
        <div className="price-display">
          <p className="price">${displayPrice?.toFixed(2) || "--"} USD</p>
          {displayDate && <p className="date-indicator">{displayDate}</p>}
          <p className={`change ${isPositive ? "positive" : "negative"}`}>
            {formattedChange} ({formattedPercent})
          </p>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-overlay">
          {isHovering ? (
            <div className="hover-price">${hoverPrice?.toFixed(2)}</div>
          ) : (
            livePrice && (
              <div 
                className="market-status-indicator" 
                style={{ 
                  backgroundColor: getStatusColor(marketStatus),
                  padding: "4px 8px",
                  borderRadius: "4px",
                  color: "#fff",
                  fontWeight: "bold"
                }}
              >
                {marketStatus}
              </div>
            )
          )}
        </div>

        {/* Chart Toggle Controls */}
        <div
          className="chart-toggle-controls"
          style={{ textAlign: "center", marginBottom: "10px" }}
        >
          <div className="chart-type-buttons">
          <button
            onClick={() => setChartType("line")}
            className={chartType === "line" ? "active" : ""}
            style={{ marginRight: "10px" }}
          >
            Line Chart
          </button>
          <button
            onClick={() => setChartType("area")}
            className={chartType === "area" ? "active" : ""}
          >
            Area Chart
          </button>
        </div>
        </div>

        <ResponsiveContainer width="100%" height={800} className="responsive-chart">
          {chartType === "line" ? (
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
              margin={{ top: 20, right: 20, left: 20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartGradientStart} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartGradientEnd} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#555"
                tick={{ fill: "#aaa", fontSize: 12 }}
                tickLine={{ stroke: "#333" }}
                axisLine={{ stroke: "#333" }}
                tickCount={5}
              />
              <YAxis
                domain={[
                  (min) => (min * 0.995).toFixed(2),
                  (max) => (max * 1.005).toFixed(2)
                ]}
                tick={{ fill: "#aaa", fontSize: 12 }}
                tickLine={{ stroke: "#333" }}
                axisLine={{ stroke: "#333" }}
                tickCount={5}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                width={60}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="custom-tooltip">
                        <p className="price-value">${payload[0].value.toFixed(2)}</p>
                        <p className="time-value">{payload[0].payload.time}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={firstPoint}
                stroke="#666"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                fillOpacity={1}
                fill="url(#colorPrice)"
                strokeWidth={2}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: "#fff",
                  fill: chartColor
                }}
              />
            </LineChart>
          ) : (
            <AreaChart
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
              margin={{ top: 20, right: 20, left: 20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPriceArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartGradientStart} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartGradientEnd} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#555"
                tick={{ fill: "#aaa", fontSize: 12 }}
                tickLine={{ stroke: "#333" }}
                axisLine={{ stroke: "#333" }}
                tickCount={5}
              />
              <YAxis
                domain={[
                  (min) => (min * 0.995).toFixed(2),
                  (max) => (max * 1.005).toFixed(2)
                ]}
                tick={{ fill: "#aaa", fontSize: 12 }}
                tickLine={{ stroke: "#333" }}
                axisLine={{ stroke: "#333" }}
                tickCount={5}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                width={60}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="custom-tooltip">
                        <p className="price-value">${payload[0].value.toFixed(2)}</p>
                        <p className="time-value">{payload[0].payload.time}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={firstPoint}
                stroke="#666"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                fillOpacity={1}
                fill="url(#colorPriceArea)"
                strokeWidth={2}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: "#fff",
                  fill: chartColor
                }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="timeframe-controls">
        <div className="timeframe-buttons">
          {["1D", "1W", "1M", "3M", "YTD", "1Y", "5Y", "MAX"].map((tf) => (
            <button
              key={tf}
              className={selectedTimeframe === tf ? "active" : ""}
              onClick={() => setSelectedTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="stock-stats-container">
        <h3 className="stock-stats-title">Key statistics</h3>
        <div className="stock-stats-grid">
          <div className="stock-stat">
            <span className="label">Market cap</span>
            <span>{formatLargeNumber(stats.marketCap)}</span>
          </div>
          <div className="stock-stat">
            <span className="label">P/E Ratio</span>
            <span>{stats.peRatio?.toFixed(2) || "--"}</span>
          </div>
          <div className="stock-stat">
            <span className="label">Avg Volume</span>
            <span>{formatLargeNumber(stats.averageVolume)}</span>
          </div>
          <div className="stock-stat">
            <span className="label">Volume</span>
            <span>{formatLargeNumber(stats.volume)}</span>
          </div>
          <div className="stock-stat">
            <span className="label">High Today</span>
            <span>${stats.high?.toFixed(2) || "--"}</span>
          </div>
          <div className="stock-stat">
            <span className="label">Low Today</span>
            <span>${stats.low?.toFixed(2) || "--"}</span>
          </div>
          <div className="stock-stat">
            <span className="label">52W High</span>
            <span>${stats["52WeekHigh"]?.toFixed(2) || "--"}</span>
          </div>
          <div className="stock-stat">
            <span className="label">52W Low</span>
            <span>${stats["52WeekLow"]?.toFixed(2) || "--"}</span>
          </div>
          <div className="stock-stat">
            <span className="label">Open</span>
            <span>${stats.open?.toFixed(2) || "--"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTrade;