import React from 'react';
import { RewardToken } from '@/lib/rewards';

interface GiftRewardModalProps {
  open: boolean;
  onClose: () => void;
  rewardType: RewardToken;
  amount: number;
  tokenIcon: React.ReactNode;
  tokenImg: string;
  onClaim: () => void;
  claimSuccess?: boolean;
  claimError?: string | null;
  onShare: () => void;
}

export default function GiftRewardModal({
  open,
  onClose,
  rewardType,
  amount,
  tokenIcon,
  tokenImg,
  onClaim,
  claimSuccess,
  claimError,
  onShare
}: GiftRewardModalProps) {
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
        padding: '30px',
        borderRadius: '15px',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          marginBottom: '20px',
          color: '#ff69b4'
        }}>
          🎁 Congratulations!
        </h2>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          fontSize: '48px'
        }}>
          {tokenIcon}
        </div>
        
        <p style={{ 
          fontSize: '18px', 
          marginBottom: '10px',
          fontWeight: 'bold'
        }}>
          You earned {amount} {rewardType}!
        </p>
        
        <p style={{ 
          fontSize: '14px', 
          marginBottom: '25px',
          color: '#666'
        }}>
          Claim your reward onChain
        </p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={onClaim}
            disabled={claimSuccess}
            style={{
              padding: '12px 24px',
              backgroundColor: claimSuccess ? '#4CAF50' : '#ff69b4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: claimSuccess ? 'default' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {claimSuccess ? '✅ Claimed!' : 'Claim Reward'}
          </button>
          
          <button
            onClick={onShare}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Share
          </button>
        </div>
        
        {claimError && (
          <p style={{ 
            color: '#ff4444', 
            marginTop: '15px',
            fontSize: '14px'
          }}>
            {claimError}
          </p>
        )}
        
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#999'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
} 