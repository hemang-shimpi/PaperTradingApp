import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification 
} from "firebase/auth";
import { auth } from "../../firebaseConfig";
import "./auth.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "Password strength: Too weak",
    color: "#ff4d4f"
  });
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

  // Password strength checker
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength({
        score: 0,
        message: "Password strength: Too weak",
        color: "#ff4d4f"
      });
      return;
    }

    // Check password strength
    const length = formData.password.length;
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumbers = /\d/.test(formData.password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
    
    let score = 0;
    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (hasUpperCase) score += 1;
    if (hasLowerCase) score += 1;
    if (hasNumbers) score += 1;
    if (hasSpecialChars) score += 1;
    
    let message, color;
    if (score < 2) {
      message = "Password strength: Too weak";
      color = "#ff4d4f";
    } else if (score < 4) {
      message = "Password strength: Fair";
      color = "#faad14";
    } else if (score < 6) {
      message = "Password strength: Good";
      color = "#52c41a";
    } else {
      message = "Password strength: Strong";
      color = "#1890ff";
    }
    
    setPasswordStrength({ score, message, color });
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password should be at least 6 characters");
      setIsLoading(false);
      return;
    }

    if (passwordStrength.score < 2) {
      setError("Please use a stronger password");
      setIsLoading(false);
      return;
    }

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // Update user profile with name
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      console.log("Signup successful", userCredential.user);
      
      // Optional: You can still make a backend call to store additional user data
      try {
        await fetch("http://127.0.0.1:8000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: userCredential.user.uid,
            name: formData.name,
            email: formData.email,
          }),
        });
      } catch (backendErr) {
        console.error("Backend registration failed, but Firebase auth succeeded", backendErr);
      }
      
      // Set success message
      setSuccess("Account created successfully! Please check your email to verify your account.");
      
      // Clear form data
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
      
      // Optional: Navigate after a delay to allow the user to see the success message
      // setTimeout(() => navigate("/verify-email"), 5000);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator component
  const PasswordStrengthIndicator = () => {
    const filledBars = Math.min(Math.floor(passwordStrength.score), 5);
    
    return (
      <div className="password-strength-container">
        <div className="strength-bars">
          {[...Array(5)].map((_, index) => (
            <div 
              key={index}
              className={`strength-bar ${index < filledBars ? 'filled' : ''}`}
              style={{ backgroundColor: index < filledBars ? passwordStrength.color : '#e1e1e1' }}
            ></div>
          ))}
        </div>
        <div className="strength-text" style={{ color: passwordStrength.color }}>
          {passwordStrength.message}
        </div>
      </div>
    );
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
          <h1>Create an Account</h1>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
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
              placeholder="Create a password"
              required
            />
            {formData.password && <PasswordStrengthIndicator />}
            <div className="password-requirements">
              <p>Password should:</p>
              <ul>
                <li className={formData.password.length >= 8 ? 'met' : ''}>
                  Be at least 8 characters long
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                  Contain at least one uppercase letter
                </li>
                <li className={/[a-z]/.test(formData.password) ? 'met' : ''}>
                  Contain at least one lowercase letter
                </li>
                <li className={/\d/.test(formData.password) ? 'met' : ''}>
                  Contain at least one number
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'met' : ''}>
                  Contain at least one special character
                </li>
              </ul>
            </div>
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
              required
            />
            {formData.password && formData.confirmPassword && (
              <div 
                className={`password-match ${
                  formData.password === formData.confirmPassword ? 'match' : 'mismatch'
                }`}
              >
                {formData.password === formData.confirmPassword
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>or</span>
        </div>
        
        <div className="auth-options">
          <p>
            Already have an account? <Link to="/login" className="auth-link">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;