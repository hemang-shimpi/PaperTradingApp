import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // For animated background effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });
      const data = await response.json();
      
      if (data.status === "success") {
        console.log("Login successful", data);
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError("Error connecting to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="auth-container"
      style={{
        backgroundPosition: `${mousePosition.x * 100}% ${mousePosition.y * 100}%`,
      }}
    >
      <div className="auth-form-container">
        <div className="auth-logo">
          <svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.268 0 0 6.268 0 14s6.268 14 14 14 14-6.268 14-14S21.732 0 14 0zm0 25.2C7.812 25.2 2.8 20.188 2.8 14S7.812 2.8 14 2.8 25.2 7.812 25.2 14 20.188 25.2 14 25.2zm0-11.2v5.6h-5.6a5.6 5.6 0 115.6-5.6z"/>
          </svg>
        </div>
      
        <div className="auth-header">
          <h1>Welcome Back</h1>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-footer">
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="auth-button" 
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-options">
          <p>
            New to Bearhood? <Link to="/signup" className="auth-link">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
