import { useState, useEffect } from 'react';
import { getPackageInfo, streamUpgradePackages } from '../api';

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

    const handleUpgrade = async () => {
        setStep('installing');
        setProgressLogs([]);
        try {
            await streamUpgradePackages(
                packages,
                { forceOverwrite, installTranslations },
                (msg) => {
                    if (msg.type === 'stdout' || msg.type === 'stderr') {
                        setProgressLogs(prev => [...prev, msg.payload]);
                    } else if (msg.type === 'done') {
                        setStep('done');
                        onSuccess();
                    } else if (msg.type === 'error') {
                        setError(msg.payload);
                    }
                }
            );
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ marginTop: 0 }}>Update Packages</h2>

                {step === 'info' && (
                    <>
                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
                            {loading && <p>Loading package details...</p>}
                            {error && <p style={{ color: 'red' }}>{error}</p>}
                            {pkgInfos.map(pkg => (
                                <div key={pkg.name} style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{pkg.name} <span className="badge">{pkg.version}</span></h4>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Size: {pkg.size}</p>
                                    {pkg.depends && (
                                        <div style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                                            <strong style={{ fontSize: '0.875rem' }}>Dependencies:</strong>
                                            <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, fontSize: '0.875rem' }}>
                                                {pkg.depends.map((dep: string) => (
                                                    <li key={dep} style={{ listStyle: 'none' }}>↳ {dep} <span className="badge" style={{ fontSize: '0.7em', padding: '2px 6px' }}>INSTALLED</span></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="input-group">
                            <label className="checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={installTranslations}
                                    onChange={e => setInstallTranslations(e.target.checked)}
                                />
                                <span style={{ marginLeft: '0.5rem' }}>Install suggested translation packages as well</span>
                            </label>
                            <label className="checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={forceOverwrite}
                                    onChange={e => setForceOverwrite(e.target.checked)}
                                />
                                <span style={{ marginLeft: '0.5rem' }}>Allow overwriting conflicting package files</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border)' }} onClick={onClose}>Cancel</button>
                            <button className="btn" onClick={handleUpgrade} disabled={loading || !!error}>Upgrade</button>
                        </div>
                    </>
                )}

                {step === 'installing' && (
                    <>
                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', background: '#000', color: '#0f0', padding: '1rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {progressLogs.map((log, i) => (
                                <div key={i}>{log}</div>
                            ))}
                            {/* Auto-scroll anchor could be added here */}
                        </div>
                        <p>Upgrading... please wait.</p>
                    </>
                )}

                {step === 'done' && (
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--success)' }}>Upgrade Successful!</h3>
                        <button className="btn" onClick={onClose}>Close</button>
                    </div>
                )}
            </div>
        </div>
    );
};
