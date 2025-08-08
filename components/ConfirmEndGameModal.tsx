import React from 'react';

interface ConfirmEndGameModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

export default function ConfirmEndGameModal({ 
  open, 
  onClose, 
  onConfirm, 
  message 
}: ConfirmEndGameModalProps) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '300px',
        textAlign: 'center',
        color:"black",
        fontWeight:"bold"
      }}>
        <h3 style={{ marginBottom: '15px' }}>Confirm Action</h3>
        <p style={{ marginBottom: '20px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ccc',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
} 