import React, { createContext, useState, useEffect, useRef } from "react";

export const MarketDataContext = createContext({});

export const MarketDataProvider = ({ children }) => {
  const [marketData, setMarketData] = useState({});
  const ws = useRef(null);

  useEffect(() => {
    // Open a single WebSocket connection for market data
    const wsUrl = "ws://127.0.0.1:8000/ws"; // change as necessary
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("Market Data WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      try {
        // We assume the server sends an object keyed by stock symbol
        // e.g., { "AAPL": { price: 150.23, ... }, "TSLA": { price: 720.45, ... }, ... }
        const data = JSON.parse(event.data);
        setMarketData(data);
      } catch (error) {
        console.error("Error parsing market data WebSocket message:", error);
      }
    };

    ws.current.onerror = (err) => {
      console.error("Market Data WebSocket error:", err);
    };

    ws.current.onclose = () => {
      console.log("Market Data WebSocket closed");
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return (
    <MarketDataContext.Provider value={marketData}>
      {children}
    </MarketDataContext.Provider>
  );
};