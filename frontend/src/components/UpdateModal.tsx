import { useState, useEffect, useRef } from 'react';
import { getPackageInfo, streamUpgradePackages } from '../api';
import { Terminal, XCircle } from 'lucide-react';

interface UpdateModalProps {
    packages: string[];
    onClose: () => void;
    onSuccess: () => void;
}

export const UpdateModal = ({ packages, onClose, onSuccess }: UpdateModalProps) => {
    const [step, setStep] = useState<'info' | 'installing' | 'done'>('info');
    const [pkgInfos, setPkgInfos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [forceOverwrite, setForceOverwrite] = useState(false);
    const [installTranslations, setInstallTranslations] = useState(false);
    const [progressLogs, setProgressLogs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const res = await getPackageInfo(packages);
                setPkgInfos(res.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch package info');
                setLoading(false);
            }
        };
        fetchInfo();
    }, [packages]);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [progressLogs, step]);

    const handleUpgrade = async () => {
        setStep('installing');
        setProgressLogs(['Starting upgrade process...']);
        try {
            await streamUpgradePackages(
                packages,
                { forceOverwrite, installTranslations },
                (msg) => {
                    if (msg.type === 'stdout' || msg.type === 'stderr') {
                        setProgressLogs(prev => [...prev, msg.payload]);
                    } else if (msg.type === 'done') {
                        setProgressLogs(prev => [...prev, 'Upgrade Process Completed.']);
                        setStep('done');
                        onSuccess();
                    } else if (msg.type === 'error') {
                        setError(msg.payload);
                        setProgressLogs(prev => [...prev, `ERROR: ${msg.payload}`]);
                    }
                }
            );
        } catch (err: any) {
            setError(err.message);
            setProgressLogs(prev => [...prev, `CRITICAL ERROR: ${err.message}`]);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Update Packages</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><XCircle /></button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {step === 'info' && (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                {loading && <p>Loading package details...</p>}
                                {error && <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}
                                {pkgInfos.map(pkg => (
                                    <div key={pkg.name} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--input-bg)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{pkg.name}</h4>
                                            <span className="badge">{pkg.version}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            <div>Size: {pkg.size}</div>
                                        </div>
                                        {pkg.depends && (
                                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                                                <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dependencies</strong>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    {pkg.depends.map((dep: string) => (
                                                        <span key={dep} style={{ fontSize: '0.75rem', background: 'var(--bg-color)', padding: '0.125rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                                            {dep}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="input-group" style={{ background: 'var(--input-bg)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                <label className="checkbox-wrapper" style={{ marginBottom: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        className="checkbox"
                                        checked={installTranslations}
                                        onChange={e => setInstallTranslations(e.target.checked)}
                                    />
                                    <span style={{ marginLeft: '0.75rem' }}>Install suggested translation packages</span>
                                </label>
                                <label className="checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        className="checkbox"
                                        checked={forceOverwrite}
                                        onChange={e => setForceOverwrite(e.target.checked)}
                                    />
                                    <span style={{ marginLeft: '0.75rem' }}>Allow overwriting conflicting files (--force-overwrite)</span>
                                </label>
                            </div>
                        </>
                    )}

                    {(step === 'installing' || step === 'done') && (
                        <div style={{
                            background: '#0f172a',
                            borderRadius: '0.5rem',
                            border: '1px solid #334155',
                            boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '400px'
                        }}>
                            <div style={{
                                padding: '0.5rem 1rem',
                                borderBottom: '1px solid #334155',
                                background: '#1e293b',
                                borderTopLeftRadius: '0.5rem',
                                borderTopRightRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#94a3b8',
                                fontSize: '0.875rem'
                            }}>
                                <Terminal size={14} />
                                <span>Terminal Output</span>
                            </div>
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '1rem',
                                fontFamily: "'Fira Code', 'Roboto Mono', monospace",
                                fontSize: '0.875rem',
                                color: '#e2e8f0',
                                lineHeight: '1.5'
                            }}>
                                {progressLogs.length === 0 && <span style={{ color: '#64748b' }}>Initializing process...</span>}
                                {progressLogs.map((log, i) => (
                                    <div key={i} style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                                        {log.startsWith('ERROR:') ? <span style={{ color: '#ff5555' }}>{log}</span> : log}
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'var(--card-bg)' }}>
                    {step === 'info' ? (
                        <>
                            <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border)' }} onClick={onClose}>Cancel</button>
                            <button className="btn" onClick={handleUpgrade} disabled={loading || !!error}>
                                Start Upgrade
                            </button>
                        </>
                    ) : step === 'done' ? (
                        <button className="btn" onClick={onClose} style={{ background: 'var(--success)' }}>Close & Reload</button>
                    ) : (
                        <button className="btn" disabled style={{ opacity: 0.7 }}>Processing...</button>
                    )}
                </div>
            </div>
        </div>
    );
};
