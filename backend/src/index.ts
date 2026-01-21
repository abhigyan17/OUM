import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { SSHHandler } from './sshHandler';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Helper to get SSH config from request
const getSSHConfig = (req: express.Request) => {
    const host = req.headers['x-ssh-host'] as string;
    const username = req.headers['x-ssh-username'] as string;
    const password = req.headers['x-ssh-password'] as string;

    if (!host || !username || !password) {
        throw new Error('Missing credentials');
    }
    return {
        host,
        username,
        password,
        port: 22,
    };
};

app.post('/api/connect', async (req, res) => {
    try {
        const config = req.body; // Expecting { host, username, password } in body for initial check
        const ssh = new SSHHandler(config);
        await ssh.executeCommand('echo "Connection Successful"');
        res.json({ message: 'Connected successfully' });
    } catch (error: any) {
        res.status(401).json({ error: 'Connection failed: ' + error.message });
    }
});

app.get('/api/packages', async (req, res) => {
    try {
        const config = getSSHConfig(req);
        const ssh = new SSHHandler(config);
        const output = await ssh.executeCommand('opkg list-installed');
        console.log('Raw opkg output:', output);

        // Parse output
        const packages = output.trim().split('\n').map(line => {
            const parts = line.split(' - ');
            return {
                name: parts[0],
                version: parts[1] || 'unknown',
                description: parts[2] || ''
            };
        });
        console.log('Parsed installed example:', packages.slice(0, 3));

        res.json(packages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/check-updates', async (req, res) => {
    try {
        const config = getSSHConfig(req);
        const ssh = new SSHHandler(config);

        // Run opkg update first to refresh lists
        await ssh.executeCommand('opkg update');

        // Get upgradable packages
        const output = await ssh.executeCommand('opkg list-upgradable');
        console.log('Raw updates output (snippet):', output.substring(0, 200));

        // Parse output: packageName - currentVersion - newVersion
        // Example: base-files - 194-r10090... - 195-r10100...
        const updates = output.trim().split('\n').map(line => {
            // Logic might vary slightly based on opkg output format, but usually:
            // pkg - old_ver - new_ver
            const parts = line.split(' - ');
            if (parts.length >= 3) {
                return {
                    name: parts[0],
                    currentVersion: parts[1],
                    newVersion: parts[2]
                };
            }
            return null;
        }).filter(p => p !== null) as { name: string, currentVersion: string, newVersion: string }[];

        console.log('Parsed updates example:', updates.slice(0, 3));

        res.json(updates);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/upgrade', async (req, res) => {
    try {
        const config = getSSHConfig(req);
        const { packages } = req.body; // Array of package names

        if (!Array.isArray(packages) || packages.length === 0) {
            return res.status(400).json({ error: 'No packages specified' });
        }

        const ssh = new SSHHandler(config);
        // Join packages with space
        const pkgList = packages.join(' ');
        const output = await ssh.executeCommand(`opkg upgrade ${pkgList}`);

        res.json({ message: 'Upgrade completed', output });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
