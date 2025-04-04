import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig"; // Adjust the path as needed
import StockTrade from "./components/StockTrade";
import TradeBox from "./components/TradeBox";
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
  const navigate = useNavigate();

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

  return (
    <div className="container">
      {/* Header with user info and logout */}
      <div className="dashboard-header">
        <div className="user-info">
          {user && <span>Welcome, {user.email}</span>}
        </div>
        <button 
          className="logout-button" 
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      <div className="left-section">
        <StockTrade stockSymbol={selectedStock} stockName={stockOptions[selectedStock]} />
      </div>

      {/* Stock Dropdown Selector */}
      <div className="ticker-dropdown">
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

      <div className="right-section">
        <TradeBox stockSymbol={selectedStock} />
      </div>
    </div>
  );
};

export default Sample_Dash;