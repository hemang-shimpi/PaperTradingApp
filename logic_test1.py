# import pandas as pd
# import matplotlib.pyplot as plt

# class PaperTradingSystem:
#     def __init__(self, initial_balance=10000):
#         self.initial_balance = initial_balance
#         self.balance = initial_balance
#         self.portfolio = {}
#         self.transactions = []
#         self.performance_history = []

#     def load_data_from_csv(self, filepath):
#         data = pd.read_csv(filepath='AAPL_data.csv', index_col='Date', parse_dates=True)
#         return data

#     def buy(self, symbol, shares, price, date):
#         shares = int(shares)
#         price = float(price)
#         cost = shares * price

#         if cost > self.balance:
#             print(f"Insufficient funds to buy {shares} shares of {symbol} at ${price:.2f}")
#             return False

#         if symbol in self.portfolio:
#             current_shares = self.portfolio[symbol]['shares']
#             current_avg_price = self.portfolio[symbol]['avg_price']
#             total_shares = current_shares + shares
#             new_avg_price = ((current_shares * current_avg_price) + cost) / total_shares
#             self.portfolio[symbol] = {'shares': total_shares, 'avg_price': new_avg_price}
#         else:
#             self.portfolio[symbol] = {'shares': shares, 'avg_price': price}

#         self.balance -= cost

#         self.transactions.append({
#             'date': date,
#             'type': 'BUY',
#             'symbol': symbol,
#             'shares': shares,
#             'price': price,
#             'total': cost,
#             'balance': self.balance
#         })

#         print(f"Bought {shares} shares of {symbol} at ${price:.2f} for ${cost:.2f}")
#         return True

#     def sell(self, symbol, shares, price, date):
#         shares = int(shares)
#         price = float(price)

#         if symbol not in self.portfolio or self.portfolio[symbol]['shares'] < shares:
#             print(f"Insufficient shares to sell {shares} shares of {symbol}")
#             return False

#         proceeds = shares * price
#         avg_price = self.portfolio[symbol]['avg_price']
#         profit_loss = proceeds - (shares * avg_price)

#         self.portfolio[symbol]['shares'] -= shares
#         if self.portfolio[symbol]['shares'] == 0:
#             del self.portfolio[symbol]

#         self.balance += proceeds

#         self.transactions.append({
#             'date': date,
#             'type': 'SELL',
#             'symbol': symbol,
#             'shares': shares,
#             'price': price,
#             'total': proceeds,
#             'profit_loss': profit_loss,
#             'balance': self.balance
#         })

#         print(f"Sold {shares} shares of {symbol} at ${price:.2f} for ${proceeds:.2f} (P/L: ${profit_loss:.2f})")
#         return True

#     def get_portfolio_value(self, current_prices):
#         total_value = self.balance
#         for symbol in self.portfolio:
#             current_price = current_prices.get(symbol, 0)
#             total_value += current_price * self.portfolio[symbol]['shares']
#         return total_value

#     def record_performance(self, date, current_prices):
#         value = self.get_portfolio_value(current_prices)
#         self.performance_history.append({'date': date, 'value': value})

#     def print_portfolio(self, current_prices):
#         print("\n===== PORTFOLIO SUMMARY =====")
#         print(f"Cash Balance: ${self.balance:.2f}")
        
#         total_value = self.balance
#         print("\nHoldings:")
        
#         for symbol in self.portfolio:
#             current_price = current_prices.get(symbol, 0)
#             details = self.portfolio[symbol]
            
#             value = details['shares'] * current_price
#             profit_loss = (current_price - details['avg_price']) * details['shares']
            
#             print(f"{symbol}: {details['shares']} shares @ Avg ${details['avg_price']:.2f}, Current ${current_price:.2f}, Value: ${value:.2f}, P/L: ${profit_loss:.2f}")
            
#             total_value += value
        
#         print(f"\nTotal Portfolio Value: ${total_value:.2f}")

# def run_simulation():
#     trader = PaperTradingSystem(initial_balance=10000)
#     symbol = "AAPL"
#     data = trader.load_data_from_csv('AAPL_data.csv')

#     data['MA20'] = data['Close'].rolling(window=20).mean()
#     data['MA50'] = data['Close'].rolling(window=50).mean()
#     data.dropna(inplace=True)

#     position_opened = False

#     for i in range(1, len(data)):
#         date = data.index[i]
        
#         prev_ma20, prev_ma50 = data['MA20'].iloc[i-1], data['MA50'].iloc[i-1]
#         curr_ma20, curr_ma50 = data['MA20'].iloc[i], data['MA50'].iloc[i]
        
#         current_price_scalar = float(data['Close'].iloc[i])

#         trader.record_performance(date, {symbol: current_price_scalar})

#         # Buy signal
#         if prev_ma20 < prev_ma50 and curr_ma20 > curr_ma50 and not position_opened:
#             available_funds = trader.balance * 0.9
#             shares_to_buy = int(available_funds / current_price_scalar)
            
#             if shares_to_buy > 0:
#                 trader.buy(symbol, shares_to_buy, current_price_scalar, date)
#                 position_opened = True

#         # Sell signal
#         elif prev_ma20 > prev_ma50 and curr_ma20 < curr_ma50 and position_opened:
#             if symbol in trader.portfolio:
#                 shares_to_sell = trader.portfolio[symbol]['shares']
#                 trader.sell(symbol, shares_to_sell, current_price_scalar, date)
#                 position_opened = False

#     latest_prices = {symbol: float(data['Close'].iloc[-1])}
#     trader.print_portfolio(latest_prices)

#     transactions_df = pd.DataFrame(trader.transactions)
#     print("\nTransaction History:")
#     print(transactions_df)

# if __name__ == "__main__":
#     run_simulation()

import pandas as pd
import matplotlib.pyplot as plt

class PaperTrading:
    def __init__(self, balance=10000, data_file='AAPL_data.csv'):
        self.balance = balance
        self.initial_balance = balance
        self.portfolio = {}  # symbol: {'quantity': int, 'avg_price': float}
        self.history = []    # list of trades
        self.data = pd.read_csv(data_file, index_col='Date', parse_dates=True)
        self.data.sort_index(inplace=True)

    def get_price(self, date):
        try:
            return float(self.data.loc[date, 'Close'])
        except KeyError:
            print(f"No data available for {date}")
            return None

    def trade(self, action, symbol, quantity, date):
        price = self.get_price(date)
        if price is None:
            return

        cost = price * quantity

        if action.upper() == "BUY":
            if cost > self.balance:
                print(f"[{date}] Insufficient funds to buy {quantity} shares at ${price:.2f}")
                return
            # Update portfolio
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
            # Update portfolio after selling
            remaining_qty = self.portfolio[symbol]['quantity'] - quantity
            if remaining_qty == 0:
                del self.portfolio[symbol]
            else:
                self.portfolio[symbol]['quantity'] = remaining_qty
            print(f"[{date}] Sold {quantity} shares of {symbol} at ${price:.2f} (P/L: ${profit_loss:.2f})")

        else:
            print("Invalid trade action. Use 'BUY' or 'SELL'.")
            return

        # Record trade history for plotting
        self.history.append({'date': pd.to_datetime(date), 'action': action.upper(), 'symbol': symbol,
                             'quantity': quantity, 'price': price})

    def summary(self):
        print("\n===== Portfolio Summary =====")
        total_value = self.balance
        print(f"Cash Balance: ${self.balance:.2f}\n")
        for symbol in self.portfolio:
            qty = self.portfolio[symbol]['quantity']
            avg_price = self.portfolio[symbol]['avg_price']
            current_price = float(self.data.iloc[-1]['Close'])
            position_value = qty * current_price
            profit_loss_unrealized = (current_price - avg_price) * qty
            total_value += position_value

            print(f"{symbol}: {qty} shares @ Avg ${avg_price:.2f}, Current Price: ${current_price:.2f}")
            print(f"   Position Value: ${position_value:.2f}, Unrealized P/L: ${profit_loss_unrealized:.2f}")

        net_profit_loss = total_value - self.initial_balance
        print(f"\nTotal Portfolio Value: ${total_value:.2f}")
        print(f"Net Profit/Loss: ${net_profit_loss:.2f}")

    def plot_trades(self):
        plt.figure(figsize=(12,6))
        
        # Plot stock prices
        plt.plot(self.data.index, self.data['Close'], label='AAPL Price', color='blue')

        # Mark buy/sell points
        buys = [trade for trade in self.history if trade['action'] == 'BUY']
        sells = [trade for trade in self.history if trade['action'] == 'SELL']

        plt.scatter([trade['date'] for trade in buys],
                    [trade['price'] for trade in buys],
                    marker='^', color='green', s=100, label='Buy')

        plt.scatter([trade['date'] for trade in sells],
                    [trade['price'] for trade in sells],
                    marker='v', color='red', s=100, label='Sell')

        plt.title('Trading History')
        plt.xlabel('Date')
        plt.ylabel('Price ($)')
        plt.legend()
        plt.grid(True)
        plt.show()

# Example Usage
if __name__ == "__main__":
    trader = PaperTrading(balance=10000)

    # Example trades (ensure these dates exist in your CSV)
    trader.trade("BUY", "AAPL", 10, "2025-01-14")
    trader.trade("SELL", "AAPL", 8, "2025-03-19")

    trader.summary()
    trader.plot_trades()
