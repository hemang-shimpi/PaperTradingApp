import React from "react";
import { Link } from "react-router-dom";
import "./landing.css";

const Landing = () => {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1>Welcome to Bearhood</h1>
        <p>Experience seamless paper trading solutions.</p>
        <div className="landing-buttons">
          <Link to="/signup" className="auth-link">Get Started</Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
