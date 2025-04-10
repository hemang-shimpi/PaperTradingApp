import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import StockTrade from "./components/StockTrade";
import TradeBox from "./components/TradeBox";
import { MarketDataContext } from "./components/MarketDataContext";
import "./index.css";

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

const Sample_Dash = ({ user }) => {
  const [selectedStock, setSelectedStock] = useState("AAPL");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isTradeBoxOpen, setIsTradeBoxOpen] = useState(false);
  const navigate = useNavigate();
  
  // Retrieve common market data from context.
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

  const toggleTradeBox = () => {
    setIsTradeBoxOpen(!isTradeBoxOpen);
  };

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-logo">Bearhood</div>
        <div className="navbar-items">
          <div className="navbar-stock-selector">
            <select
              className="styled-select"
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
            >
              {Object.entries(stockOptions).map(([symbol, name]) => (
                <option key={symbol} value={symbol}>
                  {name} ({symbol})
                </option>
              ))}
            </select>
          </div>
          <div className="navbar-links">
            <a href="/dashboard" className="nav-link active">Dashboard</a>
            <a href="/portfolio" className="nav-link">Portfolio</a>
          </div>
          <div className="navbar-user">
            {user && (
              <span className="user-greeting">
                Welcome, {user.email.split('@')[0]}
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

      <div className="content-container">
        {/* Main trading area using common market data */}
        <div className={`main-content ${isTradeBoxOpen ? "trade-box-open" : ""}`}>
          <StockTrade 
            stockSymbol={selectedStock} 
            stockName={stockOptions[selectedStock]} 
            marketData={marketData} 
          />
        </div>

        {/* Trade Box Toggle Button */}
        <button 
          className={`trade-box-toggle ${isTradeBoxOpen ? "open" : ""}`} 
          onClick={toggleTradeBox}
          aria-label={isTradeBoxOpen ? "Close trade panel" : "Open trade panel"}
        >
          {isTradeBoxOpen ? "→" : "←"}
        </button>

        {/* Collapsible Trade Box */}
        <div className={`trade-box-panel ${isTradeBoxOpen ? "open" : ""}`}>
          <div className="trade-box-container">
            <h2 className="trade-box-title">Trading: {selectedStock}</h2>
            <TradeBox stockSymbol={selectedStock} userEmail={user.email} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sample_Dash;