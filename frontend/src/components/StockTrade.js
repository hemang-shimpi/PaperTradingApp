import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Zig-zag stock data pattern
const sampleStockData = {
  AAPL: [
    { time: "9:30 AM", price: 200.50 },  // Low start
    { time: "10:00 AM", price: 145.20 }, // Up
    { time: "10:30 AM", price: 45.80 }, // Slight dip
    { time: "11:00 AM", price: 34.00 }, // Up
    { time: "11:30 AM", price: 90.30 }, // Small dip
    { time: "12:00 PM", price: 130.50 }, // Up
    { time: "12:30 PM", price: 24.20 }, // Small fluctuation
    { time: "1:00 PM", price: 30.80 },  // Slight down
    { time: "1:30 PM", price: 149.50 },  // Up
    { time: "2:00 PM", price: 147.00 },  // Down
    { time: "2:30 PM", price: 77.50 },  // More decline
    { time: "3:00 PM", price: 146.20 },  // Small recovery
    { time: "3:30 PM", price: 190.30 },  // Decline
    { time: "4:00 PM", price: 143.74 },  // End lower
  ],
};

const StockTrade = ({ stockSymbol = "AAPL", stockName = "Apple Inc." }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");

  // Get stock data based on symbol
  const stockPrices = sampleStockData[stockSymbol] || sampleStockData["AAPL"];

  // Extract price details
  const latestPrice = stockPrices[stockPrices.length - 1].price.toFixed(2);
  const previousPrice = stockPrices[stockPrices.length - 2].price.toFixed(3);
  const priceChangeRaw = (latestPrice - previousPrice).toFixed(3);
  const percentChange = ((priceChangeRaw / previousPrice) * 100).toFixed(3);

  const isPositive = priceChangeRaw > 0;
  const priceChange = isPositive ? `+$${priceChangeRaw}` : `-$${Math.abs(priceChangeRaw)}`;
  const percentChangeText = isPositive ? `+${percentChange}%` : `-${Math.abs(percentChange)}%`;

  return (
    <div className="stock-container">
      {/* Stock Info */}
      <div className="stock-info">
        <h1>{stockSymbol} ({stockName})</h1>
        <p className="price">${latestPrice} USD</p>
      </div>
      <div className="stock-details">
      <p className={`change ${isPositive ? "positive" : "negative"}`} style={{ marginLeft: "10px" }}>
          {priceChange} ({percentChangeText})
        </p>
      </div>

      {/* Stock Graph */}
      <div className="graph-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={stockPrices}>
            <XAxis dataKey="time" stroke="transparent" tick={false} />
            <YAxis stroke="transparent" tick={false} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="limegreen" 
              strokeWidth={2} 
              dot={{ r: 0 }} // Hide dots
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Timeframe Buttons */}
      <div className="timeframe-buttons">
        {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"].map((tf) => (
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
  );
};

export default StockTrade;
