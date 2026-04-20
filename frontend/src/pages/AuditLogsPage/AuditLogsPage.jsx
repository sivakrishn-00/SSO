import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import api from '../../api/api';
import './AuditLogsPage.css';
import { Shield, Clock, User, Globe, Info } from 'lucide-react';

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/audit-logs/');
            setLogs(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
            setIsLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => 
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    return (
        <div className="dashboard-root">
            <Header 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                placeholder="Search logs by user or action..." 
            />

            <main className="dash-main">
                <div className="page-header">
                    <div className="welcome-banner" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Shield className="header-icon" />
                            <h1>System Audit Logs</h1>
                        </div>
                        <p>Track every modification and access event across the entire SSO ecosystem.</p>
                    </div>
                </div>

                <div className="logs-container">
                    {isLoading ? (
                        <div className="loading-state">Monitoring system events...</div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="empty-state">No matching security logs found.</div>
                    ) : (
                        <div className="logs-table-wrapper">
                            <table className="logs-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Actor</th>
                                        <th>Action</th>
                                        <th>Detailed Event</th>
                                        <th>IP Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map(log => (
                                        <tr key={log.id}>
                                            <td>
                                                <div className="timestamp-wrapper">
                                                    <Clock size={14} />
                                                    {formatDate(log.created_at)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="actor-wrapper">
                                                    <div className="mini-avatar">{log.user_name.charAt(0).toUpperCase()}</div>
                                                    <span>{log.user_name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`action-pill ${log.action.toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="details-wrapper">
                                                    <Info size={14} />
                                                    {log.details}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="ip-wrapper">
                                                    <Globe size={14} />
                                                    {log.ip_address || 'Internal'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AuditLogsPage;
