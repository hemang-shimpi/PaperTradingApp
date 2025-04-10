import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect("trading_app.db")
cursor = conn.cursor()

# # Query all trades
# cursor.execute("SELECT * FROM trades;")
# trades = cursor.fetchall()
# print("Trades:")
# for trade in trades:
#     print(trade)

# Query all users
cursor.execute("SELECT * FROM users;")
users = cursor.fetchall()
print("\nUsers:")
for user in users:
    print(user)

conn.close()
