import React, { useState, useEffect } from 'react';
import { Plus, Search, UserCheck, Shield, Mail, Trash2, Edit2, Link as LinkIcon, CheckCircle, X } from 'lucide-react';
import api from '../../api/api';
import '../DashboardPage/DashboardPage.css'; // Reuse core layout styles
import './UsersPage.css';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const UsersPage = () => {
    const { logout, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        is_staff: false,
        is_active: true,
        custom_hue: 335
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const navigate = useNavigate();

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [availableServices, setAvailableServices] = useState([]);
    const [newAssignment, setNewAssignment] = useState({
        microservice: '',
        username: '',
        password: ''
    });
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);
    const [showAssignmentDeleteConfirm, setShowAssignmentDeleteConfirm] = useState(false);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        fetchUsers();
        fetchAvailableServices();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableServices = async () => {
        try {
            const response = await api.get('/microservices/');
            setAvailableServices(response.data);
        } catch (err) {
            console.error("Failed to fetch services", err);
        }
    };

    const handleAssignService = async (e) => {
        e.preventDefault();
        try {
            await api.post('/user-assignments/', {
                user: selectedUserId,
                microservice: newAssignment.microservice,
                username: newAssignment.username,
                password: newAssignment.password
            });
            setShowAssignModal(false);
            setNewAssignment({ microservice: '', username: '', password: '' });
            showToast("Service assigned successfully!");
        } catch (err) {
            showToast("Failed to assign service. Ensure all fields are valid.", 'error');
        }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleAddUser = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/users/', newUser);
            setShowModal(false);
            setNewUser({ username: '', email: '', first_name: '', last_name: '', password: '', is_staff: false, is_active: true, ui_theme: 'default', custom_hue: 335 });
            fetchUsers();
            showToast("User created successfully!");
        } catch (err) {
            setError(err.response?.data?.username?.[0] || "Failed to create user. Please check details.");
        }
    };

    const handleEditClick = (u) => {
        setEditUser({ ...u, password: '', custom_hue: u.custom_hue || 335 }); // Don't preload password
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = { ...editUser };
            if (!data.password) delete data.password; 
            await api.patch(`/users/${editUser.id}/`, data);
            setShowEditModal(false);
            fetchUsers();
            showToast("User account updated!");
        } catch (err) {
            setError("Failed to update user.");
        }
    };

    const handleDeleteClick = (u) => {
        setUserToDelete(u);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteUser = async () => {
        try {
            await api.delete(`/users/${userToDelete.id}/`);
            setShowDeleteConfirm(false);
            fetchUsers();
            showToast("User deleted successfully.", 'error');
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const handleDeleteAssignmentClick = (assignment) => {
        setAssignmentToDelete(assignment);
        setShowAssignmentDeleteConfirm(true);
    };

    const confirmDeleteAssignment = async () => {
        try {
            await api.delete(`/user-assignments/${assignmentToDelete.id}/`);
            setShowAssignmentDeleteConfirm(false);
            setAssignmentToDelete(null);
            fetchUsers();
            showToast("Assignment removed successfully.", 'error');
        } catch (err) {
            console.error("Assignment delete failed", err);
        }
    };

    const handleEditAssignmentClick = (uId, assignment) => {
        setSelectedUserId(uId);
        setNewAssignment({
            microservice: assignment.microservice,
            username: assignment.username,
            password: assignment.password
        });
        setShowAssignModal(true);
    };

    return (
        <div className="dashboard-root">
            <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search users..." />

            <main className="dash-main">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div className="welcome-banner" style={{ marginBottom: 0 }}>
                        <h1>User Management</h1>
                        <p>Manage enterprise accounts and system access levels.</p>
                    </div>
                    <button className="add-user-btn" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        Add New User
                    </button>
                </div>

                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map(u => (
                                <React.Fragment key={u.id}>
                                    <tr 
                                        className={expandedUserId === u.id ? 'expanded-active' : ''}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                                    >
                                        <td>
                                            <div className="user-cell">
                                                <div className="avatar-small" style={{ '--hue': u.custom_hue }}>{u.first_name?.charAt(0) || u.username.charAt(0)}</div>
                                                <div className="user-text-info">
                                                    <div className="full-name">
                                                        {u.first_name} {u.last_name}
                                                        {u.assignments?.length > 0 && (
                                                            <span className="count-pill">{u.assignments.length} services</span>
                                                        )}
                                                    </div>
                                                    <span className="username">@{u.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                    <td>
                                        <div className="email-cell">
                                            <Mail size={14} />
                                            {u.email}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`role-badge ${u.is_staff ? 'admin' : 'user'}`}>
                                            {u.is_staff ? <Shield size={12} /> : <UserCheck size={12} />}
                                            {u.is_staff ? 'Admin' : 'Operator'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`status-badge-mini ${u.is_active ? 'active' : 'inactive'}`}>
                                            <span className="dot"></span>
                                            {u.is_active ? 'Active' : 'Inactive'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button 
                                                className="icon-btn assign" 
                                                title="Assign Service"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedUserId(u.id);
                                                    setShowAssignModal(true);
                                                }}
                                            >
                                                <LinkIcon size={16} />
                                            </button>
                                            <button className="icon-btn edit" onClick={() => handleEditClick(u)}><Edit2 size={16} /></button>
                                             <button className="icon-btn delete" onClick={(e) => { e.stopPropagation(); handleDeleteClick(u); }}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedUserId === u.id && (
                                    <tr className="expansion-row">
                                        <td colSpan="5">
                                            <div className="expansion-content">
                                                <div className="expansion-header">
                                                    <h4>Linked Microservices for {u.first_name || u.username}</h4>
                                                    <button className="mini-add-btn" onClick={(e) => { e.stopPropagation(); setSelectedUserId(u.id); setShowAssignModal(true); }}>
                                                        <Plus size={12} /> Add New
                                                    </button>
                                                </div>
                                                {u.assignments?.length === 0 ? (
                                                    <p className="no-assignments">No microservices assigned to this user yet.</p>
                                                ) : (
                                                    <table className="mini-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Service</th>
                                                                <th>State</th>
                                                                <th>Username</th>
                                                                <th>Password</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {u.assignments.map(a => (
                                                                <tr key={a.id}>
                                                                    <td><strong>{a.name}</strong></td>
                                                                    <td><span className="state-tag">{a.state_name}</span></td>
                                                                    <td><code>{a.username}</code></td>
                                                                    <td><code>••••••</code></td>
                                                                    <td>
                                                                        <div className="mini-actions">
                                                                            <button className="mini-btn edit" title="Edit Master Credentials" onClick={(e) => { e.stopPropagation(); handleEditAssignmentClick(u.id, a); }}><Edit2 size={12} /></button>
                                                                            <button className="mini-btn delete" title="Revoke Access" onClick={(e) => { e.stopPropagation(); handleDeleteAssignmentClick(a); }}><Trash2 size={12} /></button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    
                    {totalPages > 1 && (
                        <div className="pagination-bar">
                            <div className="pagination-info">
                                Showing <span>{(currentPage - 1) * itemsPerPage + 1}</span> to <span>{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span>{filteredUsers.length}</span> users
                            </div>
                            <div className="pagination-controls">
                                <button 
                                    className="page-btn nav" 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                >
                                    Previous
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button 
                                        key={i + 1}
                                        className={`page-btn num ${currentPage === i + 1 ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button 
                                    className="page-btn nav" 
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Assign Service Access</h2>
                            <button className="close-modal" onClick={() => setShowAssignModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAssignService}>
                            <div className="form-group">
                                <label>Select Microservice</label>
                                <select 
                                    required 
                                    value={newAssignment.microservice}
                                    onChange={(e) => setNewAssignment({...newAssignment, microservice: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                >
                                    <option value="">-- Choose a Service --</option>
                                    {availableServices.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Service Username</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter username for this service"
                                    required 
                                    value={newAssignment.username} 
                                    onChange={(e) => setNewAssignment({...newAssignment, username: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Service Password</label>
                                <input 
                                    type="password" 
                                    placeholder="Enter password for this service"
                                    required 
                                    value={newAssignment.password} 
                                    onChange={(e) => setNewAssignment({...newAssignment, password: e.target.value})} 
                                />
                            </div>
                            <button type="submit" className="submit-user-btn">Assign Access</button>
                        </form>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add New User</h2>
                            <button className="close-modal" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddUser}>
                            {error && <p className="modal-error">{error}</p>}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input type="text" required value={newUser.first_name} onChange={(e) => setNewUser({...newUser, first_name: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input type="text" required value={newUser.last_name} onChange={(e) => setNewUser({...newUser, last_name: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <input type="text" required value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                            </div>
                            <div className="form-group checkbox">
                                <label>
                                    <input type="checkbox" checked={newUser.is_staff} onChange={(e) => setNewUser({...newUser, is_staff: e.target.checked})} />
                                    Assign as System Admin
                                </label>
                            </div>
                            <div className="form-group">
                                <label>Enterprise UI Branding</label>
                                <div className="theme-selector-container">
                                    <div className="custom-color-control">
                                        <label>Corporate Identity Hue (HSL)</label>
                                        <input 
                                            type="range" min="0" max="360" 
                                            value={newUser.custom_hue} 
                                            onChange={(e) => setNewUser({...newUser, custom_hue: parseInt(e.target.value)})} 
                                        />
                                    </div>

                                    <div className="theme-preview-box" style={{ '--hue': newUser.custom_hue }}>
                                        <div className="preview-header"></div>
                                        <div className="preview-body"></div>
                                    </div>
                                    <p className="theme-help-text">This color will be applied to the user's entire dashboard experience.</p>
                                </div>
                            </div>
                            <button type="submit" className="submit-user-btn">Create User Account</button>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Edit User Account</h2>
                            <button className="close-modal" onClick={() => setShowEditModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleUpdateUser}>
                            {error && <p className="modal-error">{error}</p>}
                            <div className="form-group">
                                <label>Username (System ID)</label>
                                <input type="text" disabled value={editUser.username} style={{ background: '#f8fafc', cursor: 'not-allowed' }} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input type="text" required value={editUser.first_name} onChange={(e) => setEditUser({...editUser, first_name: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input type="text" required value={editUser.last_name} onChange={(e) => setEditUser({...editUser, last_name: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" required value={editUser.email} onChange={(e) => setEditUser({...editUser, email: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>New Password (Optional)</label>
                                <input type="password" placeholder="Leave blank to keep current" value={editUser.password} onChange={(e) => setEditUser({...editUser, password: e.target.value})} />
                            </div>
                            <div className="form-group checkbox">
                                <label>
                                    <input type="checkbox" checked={editUser.is_active} onChange={(e) => setEditUser({...editUser, is_active: e.target.checked})} />
                                    Account Active
                                </label>
                            </div>
                            <div className="form-group checkbox">
                                <label>
                                    <input type="checkbox" checked={editUser.is_staff} onChange={(e) => setEditUser({...editUser, is_staff: e.target.checked})} />
                                    System Admin Privileges
                                </label>
                            </div>
                            <div className="form-group">
                                <label>Enterprise UI Branding</label>
                                <div className="theme-selector-container">
                                    <div className="custom-color-control">
                                        <label>Corporate Identity Hue (HSL)</label>
                                        <input 
                                            type="range" min="0" max="360" 
                                            value={editUser.custom_hue} 
                                            onChange={(e) => setEditUser({...editUser, custom_hue: parseInt(e.target.value)})} 
                                        />
                                    </div>

                                    <div className="theme-preview-box" style={{ '--hue': editUser.custom_hue }}>
                                        <div className="preview-header"></div>
                                        <div className="preview-body"></div>
                                    </div>
                                    <p className="theme-help-text">Updating this will change the user's portal theme instantly.</p>
                                </div>
                            </div>
                            <button type="submit" className="submit-user-btn">Update User</button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDeleteUser}
                title="Delete User"
                message={`Are you sure you want to delete account "${userToDelete?.username}"? This will revoke all service access.`}
            />

            <ConfirmModal 
                isOpen={showAssignmentDeleteConfirm}
                onClose={() => setShowAssignmentDeleteConfirm(false)}
                onConfirm={confirmDeleteAssignment}
                title="Revoke Service Access"
                message={`Are you sure you want to remove "${assignmentToDelete?.name}" access for this user? They will no longer be able to log in to this microservice.`}
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

export default UsersPage;
