# Paper Trading Platform Review

## Overview
This is a full-stack paper trading platform built with React frontend and Python backend, allowing users to simulate trading stocks with real-time market data.

## Architecture

### Frontend
- React-based SPA using Create React App
- Real-time market data using WebSocket
- Recharts for interactive charts
- Firebase authentication
- Responsive design with CSS

### Backend 
- Python websocket server
- SQLite database
- Real-time data ingestion
- Trading logic implementation

## Prerequisites

- Node.js >= 16
- Python >= 3.10
- pip (Python package manager)
- Git

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd PaperTradingApp
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory with Firebase config:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. Backend Setup
```bash
cd python
pip install -r requirements.txt
```

Create a `secrets.env` file in the python directory:
```
DB_CONNECTION=your_db_connection_string
API_KEY=your_market_data_api_key
```

## Running the Application

### 1. Start the Backend Server
```bash
cd python
python websocket.py
```
This starts the WebSocket server on port 8000

### 2. Start the Frontend Development Server
```bash
cd frontend
npm start
```
The app will be available at http://localhost:3000

## Key Features

### Authentication
- Email/password signup and login
- Email verification
- Password reset functionality

### Trading Features
- Real-time stock price updates
- Market buy/sell orders
- Portfolio tracking
- Performance metrics
- Order history

### Charts & Analytics
- Interactive price charts
- Multiple timeframes (1D, 1W, 1M, etc.)
- Portfolio performance visualization
- Trading volume analysis

## Project Structure

```
frontend/
  ├── public/
  ├── src/
  │   ├── components/
  │   ├── pages/
  │   ├── App.js
  │   ├── index.js
  │   └── portfolio.css
  ├── package.json
  └── README.md

python/
  ├── data_extraction.py
  ├── database.py
  ├── profit_loss.py
  ├── websocket.py
  └── requirements.txt
```

## Building for Production

### Frontend Build
```bash
cd frontend
npm run build
```
This creates an optimized production build in the `build` folder

### Backend Deployment
1. Set up a production database
2. Configure environment variables
3. Deploy the Python backend to your server
4. Update the WebSocket connection URL in frontend code

## Known Limitations

1. Limited to specific stock symbols
2. Uses simulated market data in development
3. Basic order types only (market orders)

## Future Improvements

1. Add limit orders and stop losses
2. Implement more technical indicators
3. Add paper trading competitions
4. Expand available trading instruments
5. Enhanced portfolio analytics

## Troubleshooting

### Common Issues

1. WebSocket Connection Failed
- Check if backend server is running
- Verify WebSocket URL in frontend code
- Check for firewall/network issues

2. Authentication Errors
- Verify Firebase configuration
- Check email verification status
- Clear browser cache/cookies

### Development Tips

1. Use Chrome DevTools for debugging
2. Check WebSocket messages in Network tab
3. Monitor Python server logs
4. Use React Developer Tools extension

## License
[Add License Information]
