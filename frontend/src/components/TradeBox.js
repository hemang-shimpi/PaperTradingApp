import React, { useState } from "react";
import "../index.css";

function TradeBox({ stockSymbol}) {
  const [buyOrSell, setBuyOrSell] = useState("buy"); // "buy" or "sell"
  const [units, setUnits] = useState("dollars");       // "dollars" or "shares"
  const [amount, setAmount] = useState("");

  const handleToggle = (type) => {
    setBuyOrSell(type);
  };

  return (
    <div className="trade-box-container">
      {/* Buy/Sell Tabs */}
      <div className="buy-sell-tabs">
        <button
          className={`tab ${buyOrSell === "buy" ? "active" : ""}`}
          onClick={() => handleToggle("buy")}
        >
          Buy {stockSymbol}
        </button>
        <button
          className={`tab ${buyOrSell === "sell" ? "active" : ""}`}
          onClick={() => handleToggle("sell")}
        >
          Sell {stockSymbol}
        </button>
      </div>

      <span></span>

      <div className="trade-inputs">
        <label>{buyOrSell === "buy" ? "Buy In" : "Sell In"}</label>
        <select value={units} onChange={(e) => setUnits(e.target.value)}>
          <option value="dollars">Dollars</option>
          <option value="shares">Shares</option>
        </select>

        <span></span>
        

        <label>{units === "shares" ? "Shares" : "Amount"}</label>
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {units === "shares" ? (
          <div className="estimated-row">
            <span>Market Price</span>
            <span>$0.3792</span>
          </div>
        ) : (
          <div className="estimated-row">
            <span>Estimated quantity</span>
            <span>0</span>
          </div>
        )}
      </div>

      <button className="review-order-btn">Review Order</button>

      <div className="buying-power">$0.01 buying power available</div>
      <div className="account-type">Individual</div>
    </div>
  );
}

export default TradeBox;
