import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

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
