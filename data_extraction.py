import yfinance as yf

symbol = "AAPL"
data = yf.download(['AAPL'], period='1mo')
print(data)