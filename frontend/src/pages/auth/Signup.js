import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
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

  // Check password strength whenever password changes
  useEffect(() => {
    checkPasswordStrength(formData.password);
  }, [formData.password]);

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength("");
      return;
    }
  
    // Simple password strength check
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
  
    if (isLongEnough && hasLetter && hasNumber && hasSpecial) {
      setPasswordStrength("strong");
    } else if (
      isLongEnough &&
      ((hasLetter && hasNumber) || (hasLetter && hasSpecial) || (hasNumber && hasSpecial))
    ) {
      setPasswordStrength("medium");
    } else if (password.length > 0) {
      setPasswordStrength("weak");
    } else {
      setPasswordStrength("");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePasswordMatch = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && validatePasswordMatch()) {
      handleSubmit(e);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate API call
    try {
      // Replace with actual registration logic
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // If signup successful
      console.log("Signup successful", formData);
      navigate("/dashboard");
    } catch (err) {
      setError("There was an error creating your account. Please try again.");
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
          <h1>{step === 1 ? "Create Your Account" : "Set Up Password"}</h1>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form">
          {step === 1 ? (
            <>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <button 
                type="button" 
                className="auth-button" 
                onClick={handleNext}
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a secure password"
                  minLength="8"
                  required
                />
                {formData.password && (
                  <div className="password-strength">
                    <div className={`password-strength-bar ${passwordStrength}`}></div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  minLength="8"
                  required
                />
              </div>

              <div className="form-action-buttons">
                <button 
                  type="button" 
                  className="back-button" 
                  onClick={handleBack}
                >
                  Back
                </button>
                <button 
                  type="button" 
                  className="auth-button" 
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-options">
          <p>
            Already have an account? <Link to="/login" className="auth-link">Log In</Link>
          </p>
        </div>

        <div className="auth-terms">
          <p>
            This project is a academic project for Cloud Computing class and is not affiliated with any real financial institution.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;