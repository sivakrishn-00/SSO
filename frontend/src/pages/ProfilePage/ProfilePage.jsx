import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';
import { User, Mail, CheckCircle, AlertCircle, Save } from 'lucide-react';

const ProfilePage = () => {
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        is_staff: false,
        password: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const { updateUser } = useAuth();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/profile/');
            setProfile({ ...response.data, password: '' });
            if (response.data.photo) {
                updateUser({ photo: response.data.photo });
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to fetch profile", error);
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const data = { ...profile };
            if (!data.password) delete data.password;
            
            const response = await api.patch('/profile/', data);
            showToast("Profile updated successfully!");
            setProfile({ ...profile, password: '' });
            
            // Sync with global context
            const full_name = `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim() || response.data.username;
            updateUser({ 
                photo: response.data.photo,
                name: full_name,
                email: response.data.email
            });
            
            fetchProfile(); // Refresh to get updated photo if any
        } catch (error) {
            showToast("Failed to update profile.", 'error');
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile({ ...profile, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    if (isLoading) return <div className="loading-overlay">Initializing Profile...</div>;

    const photoUrl = profile.photo ? (profile.photo.startsWith('data:') ? profile.photo : `data:image/png;base64,${profile.photo}`) : null;

    return (
        <div className="dashboard-root">
            <Header placeholder="Account Settings" />

            <main className="dash-main">
                <div className="profile-layout">
                    {/* Left Panel: Stats & Identity */}
                    <div className="profile-card identity-card">
                        <div className="avatar-container">
                            {photoUrl ? (
                                <img src={photoUrl} alt="Profile" className="avatar-image" />
                            ) : (
                                <div className="avatar-large">{profile.first_name?.charAt(0) || profile.username.charAt(0)}</div>
                            )}
                            <label className="photo-upload-overlay">
                                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                                <span>Change Photo</span>
                            </label>
                        </div>
                        <h2>{profile.first_name} {profile.last_name}</h2>
                        <span className="profile-username">@{profile.username}</span>
                        
                        <div className="identity-details">
                            <div className="details-header">Contact Information</div>
                            <div className="id-item">
                                <Mail size={16} />
                                <div className="id-group">
                                    <label>Email Address</label>
                                    <span>{profile.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Edit Form */}
                    <div className="profile-card edit-card">
                        <div className="card-header">
                            <h3>Personal Information</h3>
                            <p>Your institutional identity details (Read-Only).</p>
                        </div>

                        <form onSubmit={handleUpdate} className="profile-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input 
                                        type="text" 
                                        value={profile.first_name} 
                                        readOnly
                                        className="readonly-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input 
                                        type="text" 
                                        value={profile.last_name} 
                                        readOnly
                                        className="readonly-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input 
                                    type="email" 
                                    value={profile.email} 
                                    readOnly
                                    className="readonly-input"
                                />
                            </div>

                            <button type="submit" className="save-profile-btn">
                                <Save size={18} />
                                Update Profile & Photo
                            </button>
                        </form>
                    </div>
                </div>

                {toast.show && (
                    <div className={`toast-notification ${toast.type}`}>
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <span>{toast.message}</span>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProfilePage;
