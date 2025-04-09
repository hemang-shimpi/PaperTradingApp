from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import asyncio
import json
import os
from datetime import datetime
from pyspark.sql import SparkSession
from delta import configure_spark_with_delta_pip
from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.core.exceptions import ClientAuthenticationError
from pyspark.sql.functions import current_date, date_sub
from profit_loss import PaperTrading
import database 

# Disable origin check for WebSocket (development only)
from starlette.websockets import WebSocket as StarletteWebSocket
StarletteWebSocket._validate_origin = lambda self: None

app = FastAPI()

# Allow CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the SQLite database
database.init_db()

load_dotenv(dotenv_path="secrets.env")

client_id = os.getenv('AZURE_CLIENT_ID')
tenant_id = os.getenv('AZURE_TENANT_ID')
client_secret = os.getenv('AZURE_CLIENT_SECRET')

key_vault_url = "https://keyspprtrading.vault.azure.net/"
secret_name = "storage-key"

jars_path = "/opt/anaconda3/envs/trading/jars"
azure_jars = f"{jars_path}/hadoop-azure-3.3.1.jar,{jars_path}/hadoop-azure-datalake-3.3.1.jar"

def fetch_premarket_data(symbol):
    """
    Fetch 1-day of 30-minute data, including pre/post market.
    """
    ticker = yf.Ticker(symbol)
    df = ticker.history(period="1d", interval="30m", prepost=True)
    return df

try:
    credential = DefaultAzureCredential()
    client = SecretClient(vault_url=key_vault_url, credential=credential)
    storage_key = client.get_secret(secret_name)
except ClientAuthenticationError as e:
    print("Auth failed:", e.message)
except Exception as e:
    print("Unexpected error:", e)

builder = SparkSession.builder.appName("MyApp") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .config("spark.jars", azure_jars)

spark = configure_spark_with_delta_pip(builder).getOrCreate()

spark.conf.set("fs.azure.account.key.pprtradingstorage.dfs.core.windows.net", storage_key.value)

# Load the Delta table
df = spark.read.format("delta").load("abfss://data@pprtradingstorage.dfs.core.windows.net/clean/stocks_data/")
df.cache()

tickers = [
    "AAPL", "META", "TSLA", "GOOG", "NFLX", "GOOGL",
    "WMT", "AMD", "AMZN", "MSFT", "NVDA", "DIS", "KO", "PLTR"
]

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            prices = {}
            for symbol in tickers:
                try:
                    ticker_obj = yf.Ticker(symbol)
                    info = ticker_obj.info

                    price = (
                        info.get("postMarketPrice")
                        or info.get("preMarketPrice")
                        or info.get("regularMarketPrice")
                    )

                    prices[symbol] = {
                        "price": float(price) if price else 0.0,
                        "volume": int(info.get("volume", 0)),
                        "averageVolume": info.get("averageVolume", 0),
                        "previousClose": info.get("previousClose", 0.0),
                        "open": info.get("regularMarketOpen", 0.0),
                        "high": info.get("dayHigh", 0.0),
                        "low": info.get("dayLow", 0.0),
                        "52WeekHigh": info.get("fiftyTwoWeekHigh", 0.0),
                        "52WeekLow": info.get("fiftyTwoWeekLow", 0.0),
                        "marketCap": info.get("marketCap", 0),
                        "peRatio": info.get("trailingPE", None),
                        "currency": info.get("currency", "USD"),
                        "exchange": info.get("exchange", ""),
                        "shortName": info.get("shortName", symbol)
                    }
                except Exception as e:
                    print(f"Failed to fetch {symbol}: {e}")
                    prices[symbol] = {"error": str(e)}
            trader.update_prices(prices)
            await websocket.send_text(json.dumps(prices))
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print("Error:", e)
        await websocket.close()

trader = PaperTrading()

class TradeRequest(BaseModel):
    action: str
    symbol: str
    quantity: int
    email: str

@app.post("/trade")
def execute_trade(trade: TradeRequest):
    print("Received trade payload:", trade.dict())
    
    # If the trade action is SELL, verify that the user has enough shares.
    if trade.action.upper() == "SELL":
        current_shares = 0
        # Retrieve all trades for this user.
        trades = database.get_trades(trade.email)
        for t in trades:
            if t["symbol"].upper() == trade.symbol.upper():
                if t["action"].upper() == "BUY":
                    current_shares += t["quantity"]
                elif t["action"].upper() == "SELL":
                    current_shares -= t["quantity"]
        if current_shares < trade.quantity:
            error_message = "Not enough shares to sell"
            print(error_message)
            return {
                "status": "error",
                "message": error_message
            }
    
    # If the trade action is BUY, verify that the user has enough funds.
    elif trade.action.upper() == "BUY":
        # Dynamically get the current portfolio information.
        portfolio_data = calculate_portfolio(trade.email)
        available_cash = portfolio_data.get("cash", 0)
        
        # Get the current market price for the symbol.
        executed_price = trader.get_price(trade.symbol)
        if not executed_price:
            error_message = "Cannot determine the price for " + trade.symbol
            print(error_message)
            return {
                "status": "error",
                "message": error_message
            }
        
        total_cost = executed_price * trade.quantity
        if available_cash < total_cost:
            error_message = f"Not enough funds to buy. Available funds: ${available_cash:.2f}"
            print(error_message)
            return {
                "status": "error",
                "message": error_message
            }
    
    # Execute the trade using your trading logic.
    trader.trade(trade.action, trade.symbol, trade.quantity)
    # Refetch the executed price after the trade.
    executed_price = trader.get_price(trade.symbol)
    total = executed_price * trade.quantity if executed_price else 0

    # Only record the trade if an email was provided.
    if trade.email:
        trade_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"Inserting trade for {trade.email} at {trade_date}")
        database.add_trade(trade.email, trade.action, trade.symbol, trade.quantity, executed_price, total, trade_date)
    else:
        print("No email provided; not recording trade.")

    return {
        "status": "success",
        "action": trade.action,
        "symbol": trade.symbol,
        "quantity": trade.quantity,
        "price": executed_price,
        "total": total,
        "message": "Trade executed successfully"
    }

class SignupRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str

@app.post("/signup")
def signup(signup_data: SignupRequest):
    success = database.add_user(signup_data.firstName, signup_data.lastName, signup_data.email, signup_data.password)
    if success:
        return {"status": "success", "message": "User created successfully"}
    else:
        return {"status": "error", "message": "Email already exists"}

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
def login(login_data: LoginRequest):
    if database.verify_user(login_data.email, login_data.password):
        return {"status": "success", "message": "Login successful"}
    else:
        return {"status": "error", "message": "Invalid email or password"}


@app.get("/historical")
def get_historical_data(
    ticker: str = Query(..., description="Ticker symbol (e.g. TSLA)"),
    period: str = Query("1M", description="Period (e.g. 1D for current day, 1W, 1M, etc.)")
):
    try:
        print(f"Fetching historical data for ticker: {ticker} and period: {period}")
        
        if period == "1D":
            df_current = yf.Ticker(ticker).history(period="1d", interval="5m", prepost=True)
            if df_current.empty:
                print("No current day data available from yfinance.")
                return []
            pandas_df = df_current.reset_index()[["Datetime", "Close"]]
            pandas_df.rename(columns={"Datetime": "date", "Close": "close"}, inplace=True)
            pandas_df.sort_values("date", inplace=True)
            json_data = pandas_df.to_json(orient="records", date_format="iso")
            data_list = json.loads(json_data)
            #print("Returning current day data:", data_list)
            return data_list
        
        if period == "1W":
            df_current = yf.Ticker(ticker).history(period="1wk", interval="1h", prepost=True)
            if df_current.empty:
                print("No current day data available from yfinance.")
                return []
            pandas_df = df_current.reset_index()[["Datetime", "Close"]]
            pandas_df.rename(columns={"Datetime": "date", "Close": "close"}, inplace=True)
            pandas_df.sort_values("date", inplace=True)
            json_data = pandas_df.to_json(orient="records", date_format="iso")
            data_list = json.loads(json_data)
            #print("Returning current day data:", data_list)
            return data_list
        
        else:
            # For other periods, use the Delta table.
            df_filtered = df.filter(df.Ticker == ticker)
            
            if period == "1M":
                df_filtered = df_filtered.filter(df_filtered.date >= date_sub(current_date(), 30))
            elif period == "3M":
                df_filtered = df_filtered.filter(df_filtered.date >= date_sub(current_date(), 90))
            elif period == "YTD":
                from pyspark.sql.functions import trunc
                start_of_year = trunc(current_date(), "year")
                df_filtered = df_filtered.filter(df_filtered.date >= start_of_year)
            elif period == "1Y":
                df_filtered = df_filtered.filter(df_filtered.date >= date_sub(current_date(), 365))
            elif period == "5Y":
                df_filtered = df_filtered.filter(df_filtered.date >= date_sub(current_date(), 365 * 5))
            elif period == "MAX":
                pass 
            else:
                print(f"Unknown period: {period}")
            
            df_selected = df_filtered.select("date", "close")
            count = df_selected.count()
            print(f"Found {count} records for {ticker} with period {period}")
            pandas_df = df_selected.toPandas()
            pandas_df.sort_values("date", inplace=True)
            json_data = pandas_df.to_json(orient="records", date_format="iso")
            data_list = json.loads(json_data)
            return data_list
    except Exception as e:
        print("Error in /historical endpoint:", e)
        return {"error": str(e)}

# ------------------------------------------------------
# New Portfolio/Account Logic added below:
# ------------------------------------------------------

def calculate_portfolio(email: str):
    base_balance = 10000
    cash = base_balance
    positions = {}
    orders = []
    
    # Try to load trades from the database.
    try:
        trades = database.get_trades(email)
    except Exception as e:
        print("Error retrieving trades:", e)
        # If the table does not exist, assume no trades
        trades = []
    
    # If there are no trades, the portfolio will be based solely on the base balance.
    trades.sort(key=lambda x: x.get("date", ""))
    
    for trade in trades:
        orders.append(trade)
        action = trade["action"].upper()
        symbol = trade["symbol"]
        qty = trade["quantity"]
        price = trade["price"]
        total_value = trade["total"]
        
        if action == "BUY":
            cash -= total_value
            if symbol in positions:
                pos = positions[symbol]
                # Calculate weighted average cost
                new_total_qty = pos["quantity"] + qty
                new_total_cost = (pos["avgCost"] * pos["quantity"]) + (price * qty)
                pos["quantity"] = new_total_qty
                pos["avgCost"] = new_total_cost / new_total_qty
            else:
                positions[symbol] = {"quantity": qty, "avgCost": price}
        elif action == "SELL":
            cash += total_value
            if symbol in positions:
                pos = positions[symbol]
                pos["quantity"] -= qty
                if pos["quantity"] <= 0:
                    del positions[symbol]
                    
    positions_list = []
    total_positions_value = 0
    for symbol, pos in positions.items():
        # Use trader.get_price to fetch current market price.
        current_price = trader.get_price(symbol) or pos["avgCost"]
        market_value = pos["quantity"] * current_price
        total_positions_value += market_value
        positions_list.append({
            "symbol": symbol,
            "quantity": pos["quantity"],
            "avgCost": pos["avgCost"],
            "currentPrice": current_price,
            "marketValue": market_value
        })
    
    total_account_value = cash + total_positions_value
    total_profit_loss = total_account_value - base_balance
    
    portfolio = {
        "baseBalance": base_balance,
        "cash": cash,
        "positions": positions_list,
        "orders": orders,
        "totalPositionsValue": total_positions_value,
        "totalAccountValue": total_account_value,
        "totalProfitLoss": total_profit_loss
    }
    
    return portfolio

@app.get("/portfolio")
def get_portfolio(email: str = Query(..., description="User email for portfolio retrieval")):
    """
    REST endpoint to retrieve the user's portfolio/account summary.
    """
    try:
        portfolio = calculate_portfolio(email)
        return {"status": "success", "portfolio": portfolio}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.websocket("/ws_portfolio")
async def websocket_portfolio_endpoint(websocket: WebSocket, email: str = Query(..., description="User email for portfolio updates")):
    """
    WebSocket endpoint for real-time portfolio/account updates.
    Clients should connect with their email as a query parameter.
    """
    await websocket.accept()
    try:
        while True:
            portfolio = calculate_portfolio(email)
            await websocket.send_text(json.dumps({"portfolio": portfolio}))
            await asyncio.sleep(10)  # adjust the frequency as needed
    except WebSocketDisconnect:
        print(f"Portfolio WebSocket disconnected for {email}")
    except Exception as e:
        print("Error in portfolio WebSocket:", e)
        await websocket.close()