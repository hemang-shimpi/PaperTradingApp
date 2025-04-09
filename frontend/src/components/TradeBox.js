import React, { useState, useEffect } from "react";

const TradeBox = ({ stockSymbol, userEmail }) => {
  const [tradeType, setTradeType] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [summary, setSummary] = useState(null);
  const [ownedShares, setOwnedShares] = useState(0);
  const [availableFunds, setAvailableFunds] = useState(0);

  // Function to fetch the user's portfolio data and update funds and shares owned.
  const fetchPortfolioData = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/portfolio?email=${userEmail}`);
      if (!res.ok) {
        throw new Error("Failed to fetch portfolio data");
      }
      const data = await res.json();
      const portfolio = data.portfolio;
      console.log("Portfolio data:", data);
      setAvailableFunds(portfolio.cash);
      // Find the current position for the active stock symbol
      const currentPosition = portfolio.positions.find(
        (pos) => pos.symbol.toUpperCase() === stockSymbol.toUpperCase()
      );
      setOwnedShares(currentPosition ? currentPosition.quantity : 0);
    } catch (err) {
      console.error("Error fetching portfolio info:", err);
    }
  };

  // Fetch portfolio data on mount and whenever the userEmail or stockSymbol change.
  useEffect(() => {
    fetchPortfolioData();
  }, [userEmail, stockSymbol]);

  // Handle the trade order submission
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
      email: userEmail,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tradePayload),
      });

      const result = await res.json();
      if (result.status === "success") {
        setSummary(result);
        // Refresh the portfolio info after executing a trade
        fetchPortfolioData();
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
        <button
          className={`tab ${tradeType === "BUY" ? "active" : ""}`}
          onClick={() => setTradeType("BUY")}
        >
          BUY
        </button>
        <button
          className={`tab ${tradeType === "SELL" ? "active" : ""}`}
          onClick={() => setTradeType("SELL")}
        >
          SELL
        </button>
      </div>

      {/* User Info Display */}
      <div className="portfolio-info">
        <p>
          <strong>Funds Available:</strong> ${availableFunds.toFixed(2)}
        </p>
        <p>
          <strong>Shares Owned ({stockSymbol}):</strong> {ownedShares}
        </p>
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
          <p>
            <strong>{summary.action} Order:</strong> {summary.quantity} Shares of{" "}
            {summary.symbol}
          </p>
          <p>
            <strong>Executed Price:</strong> ${summary.price.toFixed(2)}
          </p>
          <p>
            <strong>Total:</strong> ${summary.total.toFixed(2)}
          </p>
          <p>{summary.message}</p>
        </div>
      )}
    </div>
  );
};

export default TradeBox;