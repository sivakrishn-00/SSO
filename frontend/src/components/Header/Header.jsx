import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import bavyaLogo from '../../pages/LoginPage/white_bavya.jpg';
import './Header.css';

const Header = ({ searchTerm, setSearchTerm, placeholder = "Search...", filterComponent }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <header className="dash-header">
            <div className="header-left">
                <Link to="/dashboard" className="header-logo-container">
                    <img src={bavyaLogo} alt="BAVYA Logo" className="header-logo" />
                </Link>
                <nav className="nav-links">
                    <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
                    <Link to="/services" className={`nav-link ${location.pathname === '/services' ? 'active' : ''}`}>Services</Link>
                    {user?.is_staff && (
                        <Link to="/audit-logs" className={`nav-link ${location.pathname === '/audit-logs' ? 'active' : ''}`}>Audit Logs</Link>
                    )}
                    {user?.is_staff && (
                        <Link to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}>Users</Link>
                    )}
                    <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>Profile</Link>
                </nav>
            </div>

            <div className="header-right">
                {filterComponent ? (
                    filterComponent
                ) : (
                    <div className="search-bar">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder={placeholder} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
                
                <div className="user-profile" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                    {user?.photo ? (
                        <img 
                            src={user.photo.startsWith('data:') ? user.photo : `data:image/png;base64,${user.photo}`} 
                            alt="Profile" 
                            className="avatar" 
                            style={{ objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
                    )}
                    <div className="user-info">
                        <span>{user?.name || 'User'}</span>
                    </div>
                </div>

                <button className="logout-btn" onClick={logout}>
                    <LogOut size={16} />
                    Log Out
                </button>
            </div>
        </header>
    );
};

export default Header;
