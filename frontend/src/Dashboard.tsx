import React, { useEffect, useState } from 'react';
import { checkUpdates, getPackages } from './api';
import { RefreshCw, Download, Check, Package as PackageIcon, LogOut } from 'lucide-react';
import { UpdateModal } from './components/UpdateModal';

interface Package {
    name: string;
    version: string;
    description: string;
    newVersion?: string;
}

interface DashboardProps {
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingUpdates, setCheckingUpdates] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
    const [statusMessage, setStatusMessage] = useState('');

    const [showUpdatesOnly, setShowUpdatesOnly] = useState(false);

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        try {
            const res = await getPackages();
            setPackages(res.data);
            setLoading(false);
        } catch (error: any) {
            console.error(error);
            setStatusMessage('Failed to load packages: ' + (error.response?.data?.error || error.message));
            setLoading(false);
        }
    };

    const handleCheckUpdates = async () => {
        setCheckingUpdates(true);
        setStatusMessage('Checking for updates...');
        try {
            const res = await checkUpdates();
            const updates: { name: string, newVersion: string }[] = res.data;

            // Merge updates into packages list
            setPackages(prev => {
                const updated = prev.map(p => {
                    const update = updates.find(u => u.name === p.name);
                    return update ? { ...p, newVersion: update.newVersion } : p;
                });
                // Sort: Updates first, then alphabetical
                return updated.sort((a, b) => {
                    if (a.newVersion && !b.newVersion) return -1;
                    if (!a.newVersion && b.newVersion) return 1;
                    return a.name.localeCompare(b.name);
                });
            });
            setStatusMessage(`Found ${updates.length} updates.`);
        } catch (error) {
            console.error(error);
            setStatusMessage('Failed to check updates.');
        } finally {
            setCheckingUpdates(false);
        }
    };

    const togglePackage = (name: string) => {
        const next = new Set(selectedPackages);
        if (next.has(name)) {
            next.delete(name);
        } else {
            next.add(name);
        }
        setSelectedPackages(next);
    };

    const handleUpgradeClick = () => {
        if (selectedPackages.size === 0) return;
        setShowModal(true);
    };

    const handleUpgradeSuccess = async () => {
        setStatusMessage('Upgrade completed successfully!');
        setSelectedPackages(new Set());
        setShowModal(false);
        await loadPackages();
    };

    const upgradablePackages = packages.filter(p => p.newVersion);
    const displayedPackages = showUpdatesOnly ? upgradablePackages : packages;

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>Loading packages...</div>;
    }

    return (
        <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="dashboard-header">
                <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PackageIcon size={24} color="#3b82f6" />
                        Installed Packages
                        <span className="badge">{packages.length}</span>
                    </h2>
                    {statusMessage && <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{statusMessage}</p>}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={onLogout} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <LogOut size={18} />
                        Log Out
                    </button>
                    <button className="btn" onClick={handleCheckUpdates} disabled={checkingUpdates} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <RefreshCw size={18} className={checkingUpdates ? 'spin' : ''} />
                        {checkingUpdates ? 'Checking...' : 'Check Updates'}
                    </button>
                    {upgradablePackages.length > 0 && (
                        <>
                            <button className="btn" onClick={() => setShowUpdatesOnly(!showUpdatesOnly)} style={{ background: showUpdatesOnly ? 'var(--accent)' : 'var(--card-bg)', border: '1px solid var(--border)' }}>
                                <Check size={18} />
                                {showUpdatesOnly ? 'Show All' : 'Show Updates Only'}
                            </button>
                            <button className="btn" onClick={handleUpgradeClick} disabled={selectedPackages.size === 0}>
                                <Download size={18} />
                                {`Update Selected(${selectedPackages.size})`}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="package-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                {/* Select All checkbox could go here */}
                            </th>
                            <th>Package Name</th>
                            <th>Current Version</th>
                            <th>New Version</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedPackages.map((pkg) => (
                            <tr key={pkg.name}>
                                <td>
                                    {pkg.newVersion && (
                                        <div className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                checked={selectedPackages.has(pkg.name)}
                                                onChange={() => togglePackage(pkg.name)}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td>{pkg.name}</td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{pkg.version}</td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>
                                    {pkg.newVersion || '-'}
                                </td>
                                <td>
                                    {pkg.newVersion ? (
                                        <span className="badge badge-update">Update Available</span>
                                    ) : (
                                        <span className="badge">Installed</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
    .spin {
    animation: spin 1s linear infinite;
}
@keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
}
`}</style>
            {showModal && (
                <UpdateModal
                    packages={Array.from(selectedPackages)}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleUpgradeSuccess}
                />
            )}
        </div>
    );
};
