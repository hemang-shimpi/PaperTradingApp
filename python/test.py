import yfinance as yf
from datetime import datetime

def fetch_premarket_data(symbol):
    """
    Fetch 1-day of 30-minute data, including pre/post market.
    """
    ticker = yf.Ticker(symbol)
    df = ticker.history(period="1d", interval="30m", prepost=True)
    return df

# Example usage:
if __name__ == "__main__":
    df_premarket = fetch_premarket_data("TSLA")
    print(df_premarket)
