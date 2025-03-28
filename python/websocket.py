from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import asyncio
import json
import os
from pyspark.sql import SparkSession
from delta import configure_spark_with_delta_pip
from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.core.exceptions import ClientAuthenticationError
from pyspark.sql.functions import current_date, date_sub

# Disable origin check for WebSocket (development only)
from starlette.websockets import WebSocket as StarletteWebSocket
StarletteWebSocket._validate_origin = lambda self: None

app = FastAPI()

# Allow CORS for all origins (HTTP endpoints)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv(dotenv_path="secrets.env")

client_id = os.getenv('AZURE_CLIENT_ID')
tenant_id = os.getenv('AZURE_TENANT_ID')
client_secret = os.getenv('AZURE_CLIENT_SECRET')

key_vault_url = "https://keyspprtrading.vault.azure.net/"
secret_name = "storage-key"

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
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
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

            print(prices)  # Debug output
            await websocket.send_text(json.dumps(prices))
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print("Error:", e)
        await websocket.close()


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
            print("Returning current day data:", data_list)
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
            print("Returning current day data:", data_list)
            return data_list
        
        else:
            # For periods other than current day/1week, use the Delta table.
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