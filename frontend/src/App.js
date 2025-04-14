import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
// Import your existing components
import Sample_Dash from "./Sample_Dash";

// Import new auth components
import Login from "./pages/auth/Login";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Landing from "./pages/Landing";
import Portfolio from "./Portfolio";

// CSS imports
import "./index.css";

import { MarketDataProvider } from "./components/MarketDataContext.js";


const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Only set authenticated if there's a user AND their email is verified
      setIsAuthenticated(!!currentUser);
      setIsEmailVerified(currentUser?.emailVerified || false);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <MarketDataProvider>
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route 
          path="/login" 
          element={isAuthenticated ? 
            (isEmailVerified ? <Navigate to="/dashboard" /> : <Navigate to="/verify-email" />) : 
            <Login />
          } 
        />
        <Route 
          path="/signup" 
          element={isAuthenticated ? 
            (isEmailVerified ? <Navigate to="/dashboard" /> : <Navigate to="/verify-email" />) : 
            <Signup />
          } 
        />
        <Route 
          path="/verify-email" 
          element={!isAuthenticated ? 
            <Navigate to="/login" /> : 
            (isEmailVerified ? <Navigate to="/dashboard" /> : <VerifyEmail user={user} />)
          } 
        />

        <Route 
          path="/dashboard" 
          element={!isAuthenticated ? 
            <Navigate to="/login" /> : 
            (isEmailVerified ? <Sample_Dash user={user} /> : <Navigate to="/verify-email" />)
          } 
        />

        <Route 
          path="/portfolio" 
          element={!isAuthenticated ? 
            <Navigate to="/login" /> : 
            (isEmailVerified ? <Portfolio user={user} /> : <Navigate to="/verify-email" />)
          } 
        />
        {/* Catch all - redirect to landing page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
    </MarketDataProvider>
  );
};

export default App;