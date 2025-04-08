import React, { useState } from "react";

const TradeBox = ({ stockSymbol, userEmail }) => {
  const [tradeType, setTradeType] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [summary, setSummary] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate quantity - must be a positive integer
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid quantity (a positive number).");
      return;
    }
    
    const tradePayload = {
      action: tradeType,
      symbol: stockSymbol,
      quantity: qty,
      email: userEmail
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(tradePayload)
      });

      const result = await res.json();
      if (result.status === "success") {
        setSummary(result);
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error("Trade failed:", err);
      alert("Trade failed!");
    }
  };

  return (
    <div className="trade-box">
      <div className="trade-tabs">
        <button className={`tab ${tradeType === "BUY" ? "active" : ""}`} onClick={() => setTradeType("BUY")}>BUY</button>
        <button className={`tab ${tradeType === "SELL" ? "active" : ""}`} onClick={() => setTradeType("SELL")}>SELL</button>
      </div>

      {/* Trade Order Form */}
      <form onSubmit={handleSubmit}>
        <div className="quantity-container">
          <label>Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min={0}
            required
          />
        </div>
        <p>Market Order</p>
        <button type="submit">SUBMIT ORDER</button>
      </form>

      {/* Transaction Summary */}
      {summary && (
        <div className="summary">
          <p><strong>{summary.action} Order:</strong> {summary.quantity} Shares of {summary.symbol}</p>
          <p><strong>Executed Price:</strong> ${summary.price.toFixed(2)}</p>
          <p><strong>Total:</strong> ${summary.total.toFixed(2)}</p>
          <p>{summary.message}</p>
        </div>
      )}
    </div>
  );
};

export default TradeBox;
