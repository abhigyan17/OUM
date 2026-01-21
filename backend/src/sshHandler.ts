import { Client } from 'ssh2';

export class SSHHandler {
    private config;

    constructor(config: any) {
        this.config = config;
    }

    private connect(): Promise<Client> {
        return new Promise((resolve, reject) => {
            const conn = new Client();
            conn.on('ready', () => {
                resolve(conn);
            }).on('error', (err) => {
                reject(err);
            }).connect(this.config);
        });
    }

    public async executeCommand(command: string): Promise<string> {
        const conn = await this.connect();
        return new Promise((resolve, reject) => {
            conn.exec(command, (err, stream) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }
                let data = '';
                let errorData = '';
                stream.on('close', (code: any, signal: any) => {
                    conn.end();
                    if (code !== 0) {
                        reject(new Error(`Command failed with code ${code}: ${errorData}`));
                    } else {
                        resolve(data);
                    }
                }).on('data', (chunk: any) => {
                    data += chunk;
                }).stderr.on('data', (chunk: any) => {
                    errorData += chunk;
                });
            });
        });
    }
}
