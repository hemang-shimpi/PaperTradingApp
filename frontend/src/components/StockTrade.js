import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const StockTrade = ({ stockSymbol = "AAPL", stockName = "Apple Inc." }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [priceHistory, setPriceHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [livePrice, setLivePrice] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPrice, setHoverPrice] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);

  useEffect(() => {
    const fetchHistorical = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/historical?ticker=${stockSymbol}&period=${selectedTimeframe}`);
        const data = await res.json();
        const mapped = data.map(item => {
          const dateObj = new Date(item.date);
          const label = (selectedTimeframe === "1D" || selectedTimeframe === "1W")
            ? dateObj.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
            : dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
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
      }
    };
    return () => socket.close();
  }, [stockSymbol]);

  const formatLargeNumber = (num) => {
    if (typeof num !== 'number') return "--";
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

  return (
    <div className="stock-container">
      <div className="stock-info">
        <h1>{stockSymbol} ({stockName})</h1>
        <p className="price">${displayPrice?.toFixed(2) || "--"} USD</p>
        {displayDate && <p style={{ fontSize: "14px", color: "#aaa" }}>{displayDate}</p>}
      </div>

      <div className="stock-details">
        <p className={`change ${isPositive ? "positive" : "negative"}`} style={{ marginLeft: "10px" }}>
          {formattedChange} ({formattedPercent})
        </p>
      </div>

      <div className="graph-container">
      <ResponsiveContainer width="100%" height={400}>
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

      <div className="stock-stats-container">
        <h3 className="stock-stats-title">Key statistics</h3>
        <div className="stock-stats-grid">
          <div className="stock-stat"><span className="label">Market cap</span><span>{formatLargeNumber(stats.marketCap)}</span></div>
          <div className="stock-stat"><span className="label">P/E Ratio</span><span>{stats.peRatio?.toFixed(2) || "--"}</span></div>
          <div className="stock-stat"><span className="label">Avg Volume</span><span>{formatLargeNumber(stats.averageVolume)}</span></div>
          <div className="stock-stat"><span className="label">Volume</span><span>{formatLargeNumber(stats.volume)}</span></div>
          <div className="stock-stat"><span className="label">High Today</span><span>${stats.high?.toFixed(2) || "--"}</span></div>
          <div className="stock-stat"><span className="label">Low Today</span><span>${stats.low?.toFixed(2) || "--"}</span></div>
          <div className="stock-stat"><span className="label">52W High</span><span>${stats["52WeekHigh"]?.toFixed(2) || "--"}</span></div>
          <div className="stock-stat"><span className="label">52W Low</span><span>${stats["52WeekLow"]?.toFixed(2) || "--"}</span></div>
          <div className="stock-stat"><span className="label">Open</span><span>${stats.open?.toFixed(2) || "--"}</span></div>
        </div>
      </div>
    </div>
  );
};

export default StockTrade;