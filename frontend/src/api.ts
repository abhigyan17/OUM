import axios from 'axios';

const getApiUrl = () => {
    // If a specific URL is baked in, use it.
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // Otherwise, assume backend is on the same host alongside frontend, at port 3300.
    // This supports DHCP / changing host IPs.
    return `${window.location.protocol}//${window.location.hostname}:3300/api`;
};

const API_BASE_URL = getApiUrl();

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to inject credentials from local storage (or state)
api.interceptors.request.use((config) => {
    const credentials = localStorage.getItem('ssh_credentials');
    if (credentials) {
        const { host, username, password } = JSON.parse(credentials);
        config.headers['x-ssh-host'] = host;
        config.headers['x-ssh-username'] = username;
        config.headers['x-ssh-password'] = password;
    }
    return config;
});

export const connectSSH = async (credentials: any) => {
    // Explicitly send body for the validation endpoint, but interceptor also sends headers
    return api.post('/connect', credentials);
};

export const getPackages = async () => {
    return api.get('/packages');
};

export const checkUpdates = async () => {
    return api.post('/check-updates');
};

export const upgradePackages = async (packages: string[]) => {
    return api.post('/upgrade', { packages });
};

export const getPackageInfo = async (packages: string[]) => {
    return api.post('/package-info', { packages });
};

export const streamUpgradePackages = async (
    packages: string[],
    options: { forceOverwrite: boolean; installTranslations: boolean },
    onMessage: (msg: any) => void
) => {
    const response = await fetch(`${API_BASE_URL}/upgrade`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-ssh-host': api.defaults.headers['x-ssh-host'] as string || '',
            'x-ssh-username': api.defaults.headers['x-ssh-username'] as string || '',
            'x-ssh-password': api.defaults.headers['x-ssh-password'] as string || '',
        },
        body: JSON.stringify({ packages, ...options }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.substring(6);
                    try {
                        onMessage(JSON.parse(data));
                    } catch (e) {
                        // ignore non-json or partial data
                        if (data.trim() === 'Upgrade finished') {
                            onMessage({ type: 'done' });
                        }
                    }
                }
            }
        }
    }
};
