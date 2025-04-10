from datetime import datetime

class PaperTrading:
    def __init__(self, balance=10000):
        self.balance = balance
        self.initial_balance = balance
        self.portfolio = {}  # symbol: {'quantity': int, 'avg_price': float}
        self.history = []    # list of trades
        self.latest_prices = {}  # symbol: price (updated from the websocket)

    def update_prices(self, price_data):
        """
        Update latest market prices.
        Expected format: { 'AAPL': { 'price': 175.23, ... }, ... }
        """
        for symbol, data in price_data.items():
            if 'price' in data:
                self.latest_prices[symbol] = data['price']

    def get_price(self, symbol):
        return self.latest_prices.get(symbol, None)

    def trade(self, action, symbol, quantity):
        price = self.get_price(symbol)
        date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if price is None:
            print(f"[{date}] No live price available for {symbol}")
            return

        cost = price * quantity

        if action.upper() == "BUY":
            if cost > self.balance:
                print(f"[{date}] Insufficient funds to buy {quantity} shares at ${price:.2f}")
                return
            if symbol in self.portfolio:
                prev_qty = self.portfolio[symbol]['quantity']
                prev_avg = self.portfolio[symbol]['avg_price']
                new_qty = prev_qty + quantity
                new_avg = (prev_qty * prev_avg + cost) / new_qty
                self.portfolio[symbol] = {'quantity': new_qty, 'avg_price': new_avg}
            else:
                self.portfolio[symbol] = {'quantity': quantity, 'avg_price': price}
            self.balance -= cost
            print(f"[{date}] Bought {quantity} shares of {symbol} at ${price:.2f}")

        elif action.upper() == "SELL":
            if symbol not in self.portfolio or quantity > self.portfolio[symbol]['quantity']:
                print(f"[{date}] Not enough shares to sell")
                return
            avg_buy_price = self.portfolio[symbol]['avg_price']
            profit_loss = (price - avg_buy_price) * quantity
            self.balance += cost
            remaining_qty = self.portfolio[symbol]['quantity'] - quantity
            if remaining_qty == 0:
                del self.portfolio[symbol]
            else:
                self.portfolio[symbol]['quantity'] = remaining_qty
            print(f"[{date}] Sold {quantity} shares of {symbol} at ${price:.2f} (P/L: ${profit_loss:.2f})")

        else:
            print("Invalid trade action. Use 'BUY' or 'SELL'.")
            return

        self.history.append({
            'date': date,
            'action': action.upper(),
            'symbol': symbol,
            'quantity': quantity,
            'price': price
        })

    def summary(self):
        print("\n===== Portfolio Summary =====")
        total_value = self.balance
        print(f"Cash Balance: ${self.balance:.2f}\n")
        for symbol, data in self.portfolio.items():
            qty = data['quantity']
            avg_price = data['avg_price']
            current_price = self.latest_prices.get(symbol, avg_price)
            position_value = qty * current_price
            profit_loss_unrealized = (current_price - avg_price) * qty
            total_value += position_value

            print(f"{symbol}: {qty} shares @ Avg ${avg_price:.2f}, Current Price: ${current_price:.2f}")
            print(f"   Position Value: ${position_value:.2f}, Unrealized P/L: ${profit_loss_unrealized:.2f}")

        net_profit_loss = total_value - self.initial_balance
        print(f"\nTotal Portfolio Value: ${total_value:.2f}")
        print(f"Net Profit/Loss: ${net_profit_loss:.2f}")
