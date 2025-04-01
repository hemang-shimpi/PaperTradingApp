import React, { useState } from "react";
import StockTrade from "./components/StockTrade";
import TradeBox from "./components/TradeBox";
import "./index.css";



const stockOptions = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  GOOG: "Alphabet Inc.",
  TSLA: "Tesla Inc.",
  AMZN: "Amazon.com Inc."
};

const App = () => {
  const [selectedStock, setSelectedStock] = useState("AAPL");

  return (
    <div className="container">

      <div className="left-section">
        <StockTrade stockSymbol={selectedStock} stockName={stockOptions[selectedStock]} />
      </div>

      {/* Stock Search Bar */}
      <div className="stock-search">
        <input
          type="text"
          placeholder="Search stock..."
          list="stocks"
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            if (stockOptions[val]) setSelectedStock(val);
          }}
        />
        <datalist id="stocks">
          {Object.keys(stockOptions).map((stock) => (
            <option key={stock} value={stock} />
          ))}
        </datalist>
      </div>
      <div className="right-section">
        <TradeBox stockSymbol={selectedStock} />
      </div>
    </div>
  );
};

export default App;
