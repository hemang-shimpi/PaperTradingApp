from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import yfinance as yf
import asyncio

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            ticker = yf.Ticker("TSLA")
            info = ticker.info
            price = info.get("postMarketPrice") or info.get("preMarketPrice") or info.get("regularMarketPrice")
            if price is None:
                price = "0.00"
            print(price)
            await websocket.send_text(str(price))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print("Error:", e)
        await websocket.close()


