import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

export default function VerificationBanner() {
  const { email, emailVerified, markEmailVerified } = useAuth();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('otp-banner-dismissed') === 'true');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);

  if (emailVerified || dismissed) return null;

  async function handleVerify(e) {
    e.preventDefault();
    setOtpError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-code', { email, code: otpCode });
      markEmailVerified();
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Código inválido.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await api.post('/auth/resend-verification', { email });
    } catch {
      // silent
    }
  }

  function handleDismiss() {
    sessionStorage.setItem('otp-banner-dismissed', 'true');
    setDismissed(true);
  }

  return (
    <div style={{
      background: '#fff8e1',
      borderBottom: '1px solid #ffb300',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
      fontSize: 13,
    }}>
      <span style={{ fontWeight: 600, color: '#e65100' }}>⚠ Email não verificado</span>
      <span style={{ color: '#555' }}>
        Digite o código enviado para <strong>{email}</strong>:
      </span>
      <form onSubmit={handleVerify} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          style={{
            border: '1px solid #ccc', borderRadius: 6, padding: '4px 10px',
            fontSize: 16, letterSpacing: 6, width: 100, textAlign: 'center',
          }}
        />
        <button
          type="submit"
          className="btn btn--sm btn--primary"
          disabled={loading || otpCode.length < 6}
        >
          {loading ? '…' : 'Verificar'}
        </button>
      </form>
      {otpError && <span style={{ color: '#f65151' }}>{otpError}</span>}
      <button
        type="button"
        onClick={handleResend}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, padding: 0 }}
      >
        Reenviar código
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  );
}
