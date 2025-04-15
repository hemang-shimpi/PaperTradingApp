# Paper Trading App Documentation

## Overview
A comprehensive full-stack paper trading platform allowing users to simulate stock trading with real-time market data. Built with a React frontend and Python backend, this platform offers an authentic trading experience without financial risk.

## Architecture

### Frontend
- Framework: React Single Page Application (SPA) built with Create React App
- Market Data: Real-time updates via WebSocket connection 
- Visualization: Interactive charts powered by Recharts library
- Authentication: Secure user management through Firebase
- Styling: Responsive design with modern CSS techniques

### Backend
- Server: Python WebSocket server handling real-time communications
- Database: SQLite for data persistence with efficient query optimization
- Data Processing: Real-time market data ingestion and processing pipeline
- Business Logic: Robust implementation of trading mechanics and order execution

## Prerequisites
- Node.js ≥ 16.0.0
- Python ≥ 3.10.0
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

Create a `firebaseConfig.js` file in the frontend/src/ directory:
```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
```

### 3. Backend Setup
```bash
cd python
pip install -r requirements.txt
```

Create a `secrets.env` file in the python directory:
```
AZURE_CLIENT_ID="YOUR_CLIENT_ID"
AZURE_TENANT_ID="YOUR_TENANT_ID"
AZURE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
```

*Note: If using Anaconda, place the following JAR files in `/opt/anaconda3/envs/trading/jars`:*
- hadoop-azure-datalake-3.3.1.jar
- hadoop-azure-3.3.1.jar

## Running the Application

### 1. Start the Backend Server
```bash
cd python
python -m uvicorn websocket:app --reload
```
The WebSocket server will be available at `ws://localhost:8000`.

### 2. Start the Frontend Development Server
```bash
cd frontend
npm start
```
Access the application at `http://localhost:3000`.

## Key Features

### Authentication
- Secure email/password registration and login
- Email verification workflow
- Self-service password reset functionality
- Session management

### Trading Features
- Real-time stock price updates with minimal latency
- Market buy/sell order execution
- Comprehensive portfolio tracking and management
- Performance metrics including P&L, ROI, and drawdown
- Detailed order history with execution analytics

### Charts & Analytics
- Interactive price charts with customizable indicators
- Multiple timeframe options (1D, 1W, 1M, 3M, 6M, 1Y)
- Portfolio performance visualization with benchmark comparison
- Trading volume analysis with liquidity indicators
- Position sizing recommendations

## Project Structure
```
frontend/
  ├── public/           # Static assets and HTML template
  ├── src/
  │   ├── components/   # Reusable components
  │   ├── pages/        # Page-level components
  │   ├── App.js        # Application root component
  │   ├── Sample_Dash.js   # Application dashboard component
  │   ├── Portfolio.js   # Application portfolio component
  │   ├── index.css  
  │   ├── portfolio.css   
  │   ├── index.js      # Entry point
  │   ├── index.html    
  ├── package.json      # Dependencies and scripts
  └── README.md         # Frontend documentation

python/
  ├── data_extraction.py   # Market data ingestion logic
  ├── database.py          # Database models and operations
  ├── profit_loss.py       # P&L calculation algorithms
  ├── websocket.py         # WebSocket server implementation
  └── requirements.txt     # Python dependencies
```

## Building for Production

### Frontend Build
```bash
cd frontend
npm run build
```
This creates an optimized production build in the `build` folder with minimized assets.

### Backend Deployment
1. Set up a production-grade database (PostgreSQL recommended)
2. Configure environment variables for production settings
3. Deploy the Python backend to your server infrastructure
4. Update the WebSocket connection URL in frontend code
5. Consider using a process manager like PM2 or Supervisor

## Known Limitations
- Limited to specific stock symbols (currently supports major US equities)
- Uses simulated market data in development environment
- Supports basic order types only (market orders)
- No options or derivatives trading
- Historical data limited to 2 years

## Future Improvements
1. Add advanced order types (limit orders, stop losses, trailing stops)
2. Implement comprehensive technical indicators library
3. Create paper trading competitions with leaderboards
4. Expand available trading instruments (options, futures, forex)
5. Enhance portfolio analytics with risk metrics
6. Integrate social features for community learning
7. Add mobile applications for iOS and Android

## Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- Verify the backend server is running and accessible
- Check WebSocket URL configuration in frontend code
- Confirm no firewall or network restrictions are blocking WebSocket traffic
- Examine backend logs for connection rejection errors

#### Authentication Errors
- Verify Firebase configuration matches your project settings
- Check email verification status in Firebase console
- Clear browser cache and cookies
- Ensure proper CORS configuration in backend

#### Performance Issues
- Monitor WebSocket message frequency and payload size
- Check for memory leaks in React components
- Review backend resource utilization during peak loads
- Optimize database queries causing slowdowns

### Development Tips
- Use Chrome DevTools Network tab to monitor WebSocket traffic
- Enable React Developer Tools for component debugging
- Implement logging for critical backend operations
- Test with different network conditions using Chrome DevTools
- Use mock data during frontend development for consistent testing
