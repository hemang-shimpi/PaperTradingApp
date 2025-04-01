import React, { useState } from "react";

const TradeBox = ({ stockSymbol }) => {
  const [tradeType, setTradeType] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [summary, setSummary] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentPrice = 135.00;
    const total = (quantity * currentPrice).toFixed(2);
    setSummary({
      stock: stockSymbol,
      type: tradeType,
      quantity,
      price: currentPrice,
      total,
    });
  };

  return (
    <div className="trade-box">
      {/* Buy/Sell Tabs */}
      <div className="trade-tabs">
        <button className={`tab ${tradeType === "BUY" ? "active" : ""}`} onClick={() => setTradeType("BUY")}>
          BUY
        </button>
        <button className={`tab ${tradeType === "SELL" ? "active" : ""}`} onClick={() => setTradeType("SELL")}>
          SELL
        </button>
      </div>

      {/* Order Form */}
      <form onSubmit={handleSubmit}>
        <div className="quantity-container">
          <label>Quantity:</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </div>
        <p>Current Price: <strong>$135.00</strong></p>
        <button type="submit">SUBMIT ORDER</button>
      </form>

      {/* Transaction Summary */}
      {summary && (
        <div className="summary">
          <p><strong>{summary.type} Order:</strong> {summary.quantity} Shares of {summary.stock}</p>
          <p><strong>Total:</strong> ${summary.total}</p>
        </div>
      )}
    </div>
  );
};

export default TradeBox;
