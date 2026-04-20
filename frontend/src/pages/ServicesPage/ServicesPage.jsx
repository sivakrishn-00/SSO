import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import './ServicesPage.css';
import { Plus, Globe, Trash2, Edit2, Link as LinkIcon, CheckCircle, X, MapPin, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const ServicesPage = () => {
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editService, setEditService] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [error, setError] = useState('');
    const [states, setStates] = useState([]);
    const [showStateModal, setShowStateModal] = useState(false);
    const [newStateName, setNewStateName] = useState('');
    const [stateError, setStateError] = useState('');

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const [newService, setNewService] = useState({
        name: '',
        url: '',
        state: '',
        description: ''
    });

    useEffect(() => {
        fetchServices();
        fetchStates();
    }, []);

    const fetchStates = async () => {
        try {
            const response = await api.get('/states/');
            setStates(response.data);
        } catch (err) {
            console.error("Failed to fetch states", err);
        }
    };

    const handleAddState = async (e) => {
        e.preventDefault();
        setStateError('');
        try {
            await api.post('/states/', { name: newStateName });
            setNewStateName('');
            setShowStateModal(false);
            fetchStates();
            showToast(`State "${newStateName}" created successfully!`);
        } catch (err) {
            if (err.response && err.response.status === 400) {
                setStateError("This state already exists. Please enter a unique name.");
            } else {
                setStateError("Something went wrong. Please try again later.");
            }
        }
    };

    const fetchServices = async () => {
        try {
            // If staff, fetch all microservices. If not, fetch only assigned ones via the dashboard endpoint.
            const endpoint = user.is_staff ? '/microservices/' : '/dashboard/';
            const response = await api.get(endpoint);
            setServices(response.data);
        } catch (error) {
            console.error("Failed to fetch services", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/microservices/', newService);
            setShowModal(false);
            setNewService({ name: '', url: '', state: '', description: '' });
            fetchServices();
            showToast("Service registered successfully!");
        } catch (err) {
            setError("Failed to register service. Ensure Name and URL are valid.");
        }
    };

    const handleDeleteClick = (service) => {
        setServiceToDelete(service);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/microservices/${serviceToDelete.id}/`);
            setShowDeleteConfirm(false);
            setServiceToDelete(null);
            fetchServices();
            showToast("Service deleted successfully.", 'error');
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const handleEditClick = (service) => {
        setEditService({ ...service });
        setShowEditModal(true);
    };

    const handleUpdateService = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.put(`/microservices/${editService.id}/`, editService);
            setShowEditModal(false);
            setEditService(null);
            fetchServices();
            showToast("Service updated successfully!");
        } catch (err) {
            setError("Failed to update service. Please check your data.");
        }
    };

    const StateFilter = (
        <div className="state-filter-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Filter size={16} color="white" />
            <select 
                value={selectedState} 
                onChange={(e) => setSelectedState(e.target.value)}
                style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
                <option value="" style={{ color: '#1e293b' }}>All States</option>
                {states.map(s => (
                    <option key={s.id} value={s.id} style={{ color: '#1e293b' }}>{s.name}</option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="dashboard-root">
            <Header filterComponent={StateFilter} />

            <main className="dash-main">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div className="welcome-banner" style={{ marginBottom: 0 }}>
                        <h1>{user.is_staff ? "Services Registry" : "Your Available Services"}</h1>
                        <p>{user.is_staff ? "Manage the master list of available microservices." : "A complete list of microservices currently assigned to your account."}</p>
                    </div>
                    {user.is_staff && (
                        <button className="add-user-btn" onClick={() => setShowModal(true)}>
                            <Plus size={18} />
                            Register New Service
                        </button>
                    )}
                </div>

                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Service Name</th>
                                <th>URL / Endpoint</th>
                                <th>Description</th>
                                <th>Status</th>
                                {user.is_staff && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {services
                                .filter(s => {
                                    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
                                    const matchesState = selectedState ? String(s.state) === String(selectedState) : true;
                                    return matchesSearch && matchesState;
                                })
                                .map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="service-icon"><Globe size={18} /></div>
                                            <div className="user-name-info">
                                                <span className="full-name">{s.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="email-cell">
                                            <Link size={14} />
                                            <span style={{color: '#64748b'}}>{s.url}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="description-cell">{s.description || 'No description provided'}</span>
                                    </td>
                                    <td>
                                        <div className={`status-badge-mini ${s.status}`}>
                                            <span className="dot"></span>
                                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                                        </div>
                                    </td>
                                    {user.is_staff && (
                                        <td>
                                            <div className="action-btns">
                                                <button className="icon-btn edit" onClick={() => handleEditClick(s)}><Edit2 size={16} /></button>
                                                <button className="icon-btn delete" onClick={() => handleDeleteClick(s)}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Register Master Service</h2>
                            <button className="close-modal" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddService}>
                            {error && <p className="modal-error">{error}</p>}
                            <div className="form-group">
                                <label>Service Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Laboratory System"
                                    required 
                                    value={newService.name} 
                                    onChange={(e) => setNewService({...newService, name: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Target URL (Login Endpoint)</label>
                                <input 
                                    type="url" 
                                    placeholder="https://lab.bavya.com/login"
                                    required 
                                    value={newService.url} 
                                    onChange={(e) => setNewService({...newService, url: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Operational State</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select 
                                        required 
                                        value={newService.state}
                                        onChange={(e) => setNewService({...newService, state: e.target.value})}
                                        className="form-input-select"
                                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white' }}
                                    >
                                        <option value="">-- Select State --</option>
                                        {states.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button"
                                        onClick={() => setShowStateModal(true)}
                                        style={{ background: '#d6336c', color: 'white', border: 'none', borderRadius: '10px', width: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <input 
                                    type="text" 
                                    placeholder="Brief description of service"
                                    value={newService.description} 
                                    onChange={(e) => setNewService({...newService, description: e.target.value})} 
                                />
                            </div>
                            <button type="submit" className="submit-user-btn">Register Service</button>
                        </form>
                    </div>
                </div>
            )}

            {showStateModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Add New State</h2>
                            <button className="close-modal" onClick={() => setShowStateModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddState}>
                            {stateError && (
                                <div style={{ color: '#e11d48', background: '#fff1f2', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', border: '1px solid #ffe4e6', fontWeight: '600' }}>
                                    {stateError}
                                </div>
                            )}
                            <div className="form-group">
                                <label>State Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. Karnataka"
                                    value={newStateName} 
                                    onChange={(e) => setNewStateName(e.target.value)} 
                                />
                            </div>
                            <button type="submit" className="submit-user-btn">Create State</button>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editService && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Edit Master Service</h2>
                            <button className="close-modal" onClick={() => setShowEditModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleUpdateService}>
                            {error && <p className="modal-error">{error}</p>}
                            <div className="form-group">
                                <label>Service Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={editService.name} 
                                    onChange={(e) => setEditService({...editService, name: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Target URL</label>
                                <input 
                                    type="url" 
                                    required 
                                    value={editService.url} 
                                    onChange={(e) => setEditService({...editService, url: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Operational State</label>
                                <select 
                                    required 
                                    value={editService.state}
                                    onChange={(e) => setEditService({...editService, state: e.target.value})}
                                    className="form-input-select"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white' }}
                                >
                                    {states.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>System Status</label>
                                <select 
                                    required 
                                    value={editService.status}
                                    onChange={(e) => setEditService({...editService, status: e.target.value})}
                                    className="form-input-select"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white' }}
                                >
                                    <option value="online">Online / Active</option>
                                    <option value="offline">Offline / Inactive</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input 
                                    type="text" 
                                    value={editService.description || ''} 
                                    onChange={(e) => setEditService({...editService, description: e.target.value})} 
                                />
                            </div>
                            <button type="submit" className="submit-user-btn">Update Service</button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete Service"
                message={`Are you sure you want to delete "${serviceToDelete?.name}"? This action cannot be undone.`}
            />

            {toast.show && (
                <div className={`toast-notification ${toast.type}`}>
                    <CheckCircle size={18} />
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default ServicesPage;
