import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ExternalLink, Database, Globe, Layers, Settings, LogOut, Search, Grid, Clock } from 'lucide-react';
import api from '../../api/api';
import bavyaLogo from '../LoginPage/white_bavya.jpg';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import './DashboardPage.css';

const DashboardPage = () => {
    const { logout, user } = useAuth();
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await api.get('/dashboard/');
                setServices(response.data);
            } catch (error) {
                console.error("Failed to fetch services", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, []);

    const handleLaunch = (service) => {
        const savedUser = localStorage.getItem('sso_user');
        const token = savedUser ? JSON.parse(savedUser).token : null;
        
        if (!token) {
            console.error("No auth token found. Please log in again.");
            return;
        }

        const relayUrl = `${api.defaults.baseURL}/launch/${service.id}/?token=${token}`;
        window.open(relayUrl, '_blank');
    };

    const filteredServices = services.filter(s => 
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIcon = (iconName) => {
        switch(iconName) {
            case 'Database': return <Database size={24} />;
            case 'Globe': return <Globe size={24} />;
            case 'Layers': return <Layers size={24} />;
            default: return <Grid size={24} />;
        }
    };

    return (
        <div className="dashboard-root">
            <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search apps..." />

            <main className="dash-main">
                <div className="welcome-banner">
                    <h1>System Dashboard</h1>
                    <p>Welcome back! You have access to {services.length} connected microservices.</p>
                </div>

                {isLoading ? (
                    <div className="loading-state">Loading system assets...</div>
                ) : (
                    <div className="services-grid">
                        {filteredServices.map(service => (
                            <div key={service.id} className="service-card">
                                <div className="service-header">
                                    <div className="service-icon">
                                        {getIcon(service.icon)}
                                    </div>
                                    <div className={`status-indicator ${service.status}`}>
                                        {service.status}
                                    </div>
                                </div>
                                <div className="service-info">
                                    <h3>{service.name}</h3>
                                    <span className="service-category">{service.category}</span>
                                </div>
                                <div className="service-meta">
                                    <div className="meta-item">
                                        <Clock size={12} />
                                        Updated 2h ago
                                    </div>
                                    <button 
                                        className="launch-btn" 
                                        onClick={() => handleLaunch(service)}
                                    >
                                        Launch
                                        <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;
