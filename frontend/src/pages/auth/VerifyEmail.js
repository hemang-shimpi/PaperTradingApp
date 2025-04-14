import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { signOut, sendEmailVerification, reload } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import "./auth.css";

const VerifyEmail = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  // Periodically check if email is verified
  useEffect(() => {
    if (!user) return;

    const checkEmailVerified = async () => {
      try {
        await reload(user);
        if (user.emailVerified) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error checking email verification:", err);
      }
    };

    const interval = setInterval(checkEmailVerified, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [user, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && !canResend) {
      setCanResend(true);
    }
  }, [timer, canResend]);

  const handleResendVerification = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    
    try {
      await sendEmailVerification(user);
      setMessage("Verification email resent! Please check your inbox.");
      setCanResend(false);
      setTimer(60);
    } catch (err) {
      console.error("Error sending verification email:", err);
      setError("Failed to resend verification email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-logo">
          <svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.268 0 0 6.268 0 14s6.268 14 14 14 14-6.268 14-14S21.732 0 14 0zm0 25.2C7.812 25.2 2.8 20.188 2.8 14S7.812 2.8 14 2.8 25.2 7.812 25.2 14 20.188 25.2 14 25.2zm0-11.2v5.6h-5.6a5.6 5.6 0 115.6-5.6z"/>
          </svg>
        </div>
        
        <div className="auth-header">
          <h1>Verify Your Email</h1>
          <br/><br/><br/>
          <p className="auth-subheader">
            A verification email has been sent to <strong>{user.email}</strong>.
            Please check your inbox (or spam folder) and click on the verification link to continue.
          </p>
        </div>
        
        <div className="verify-email-content">
          {message && <div className="auth-success">{message}</div>}
          {error && <div className="auth-error">{error}</div>}
          
          <button
            onClick={handleResendVerification}
            className="auth-button"
            disabled={loading || !canResend}
          >
            {loading ? "Sending..." : canResend ? "Resend Verification Email" : `Resend in ${timer}s`}
          </button>
          <br/>
          <button onClick={handleLogout} className="auth-button secondary">
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;