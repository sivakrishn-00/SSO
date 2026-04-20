import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, ArrowRight } from 'lucide-react';
import './LoginPage.css';
import bavyaLogo from './white_bavya.jpg';
import api from '../../api/api';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const response = await api.post('/login/', {
                username,
                password
            });
            
            login(response.data); // Stores user info and token
            navigate('/dashboard');
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.error || err.response?.data?.non_field_errors?.[0] || "Invalid credentials. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-root">
            <div className="split-container">
                {/* Left Panel: Branding & Visuals */}
                <div className="left-panel">
                    <div className="branding-content">
                        <h1>Digital connects</h1>
                        <p>Access all your enterprise microservices securely from a single unified dashboard. rest all fien k</p>
                    </div>
                </div>

                {/* Right Panel: Login Form */}
                <div className="right-panel">
                    <div className="login-box">
                        <div className="auth-header">
                            <img src={bavyaLogo} alt="Bavya Logo" className="form-logo" />
                            <h2>Welcome Back</h2>
                            <p>Please enter your details to sign in</p>
                        </div>

                        {error && (
                            <div className="login-error-msg">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-field">
                                <label>Username</label>
                                <div className="input-group">
                                    <User size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Enter your username" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Password</label>
                                <div className="input-group">
                                    <Lock size={18} />
                                    <input 
                                        type="password" 
                                        placeholder="Enter your password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="forgot-link">
                                <a href="#">Forgot Password?</a>
                            </div>

                            <button type="submit" className="auth-btn" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Sign In Dashboard"}
                                {!isLoading && <ArrowRight size={18} />}
                            </button>
                        </form>

                        <div className="auth-footer">
                           <p>© Powered by <span className="brand-name">BAVYA</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
