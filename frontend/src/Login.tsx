import React, { useState } from 'react';
import { connectSSH } from './api';
import { Terminal, Lock, User, Wifi } from 'lucide-react';

interface LoginProps {
    onLogin: (credentials: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [host, setHost] = useState('192.168.31.1');
    const [username, setUsername] = useState('root');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const credentials = { host, username, password };

        try {
            await connectSSH(credentials);
            // Save to local storage for persistence across reloads if desired, 
            // but for security maybe strictly in memory or session storage. 
            // For this app, we'll pass it up.
            localStorage.setItem('ssh_credentials', JSON.stringify(credentials));
            onLogin(credentials);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to connect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container card">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                }}>
                    <Terminal size={32} color="#3b82f6" />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Update Manager</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Connect to your OpenWrt Router</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label className="input-label">Gateway IP</label>
                    <div style={{ position: 'relative' }}>
                        <Wifi size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            className="input-field"
                            style={{ paddingLeft: '3rem', width: '100%', boxSizing: 'border-box' }}
                            value={host}
                            onChange={(e) => setHost(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">Username</label>
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            className="input-field"
                            style={{ paddingLeft: '3rem', width: '100%', boxSizing: 'border-box' }}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="password"
                            className="input-field"
                            style={{ paddingLeft: '3rem', width: '100%', boxSizing: 'border-box' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

                <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Connecting...' : 'Connect'}
                </button>
            </form>
        </div>
    );
};
