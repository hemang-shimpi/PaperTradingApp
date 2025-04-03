import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import your existing components
import Sample_Dash from "./Sample_Dash";

// Import new auth components
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Landing from "./pages/Landing";

// CSS imports
import "./index.css";

const App = () => {
  const isAuthenticated = true; // Changed to false to test landing page

  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/home" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Sample_Dash /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/" 
            element={<Navigate to="/home" />} 
          />
        </Routes>
      </Router>
    </div>
  );
};

export default App;