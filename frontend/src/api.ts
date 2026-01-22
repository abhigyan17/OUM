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
