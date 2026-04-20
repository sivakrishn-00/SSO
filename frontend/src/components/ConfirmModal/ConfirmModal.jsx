import React from 'react';
import { Trash2, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete" }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay confirm-modal">
            <div className="modal-content confirm-box">
                <div className="modal-header">
                    <div className="trash-icon-container">
                        <Trash2 size={24} color="#e11d48" />
                    </div>
                    <button className="close-modal" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="confirm-body">
                    <h2>{title}</h2>
                    <p>{message}</p>
                </div>
                <div className="confirm-actions">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="confirm-delete-btn" onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
