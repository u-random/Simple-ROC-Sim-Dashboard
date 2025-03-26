// src/utils/BaseSocketClient.ts - Mirrors Unity-side class abstraction
// This file defines the base WebSocket client code to share between
// TelemetryClient.ts and VideoClient.ts


export enum ConnectionState {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Connected = 'connected',
    Reconnecting = 'reconnecting'
}

export interface SocketClientConfig {
    reconnectInterval: number;
    maxReconnectAttempts: number;
    maxReconnectDelay: number;
    heartbeatInterval: number;
}

export abstract class BaseSocketClient {
    protected socket: WebSocket | null = null;
    protected serverUrl: string;
    protected running: boolean = false;
    protected connectionState: ConnectionState = ConnectionState.Disconnected;
    protected reconnectTimeout: NodeJS.Timeout | null = null;
    protected heartbeatInterval: NodeJS.Timeout | null = null;
    protected reconnectAttempts: number = 0;
    protected onConnectionStateChanged: ((state: ConnectionState) => void) | null = null;
    protected config: SocketClientConfig;

    constructor(
        serverIp: string,
        port: number,
        onConnectionStateChanged?: (state: ConnectionState) => void,
        config?: Partial<SocketClientConfig>
    ) {
        this.serverUrl = `ws://${serverIp}:${port}`;
        this.onConnectionStateChanged = onConnectionStateChanged || null;

        // Default configuration
        this.config = {
            reconnectInterval: 2000,
            maxReconnectAttempts: 5,
            maxReconnectDelay: 30000,
            heartbeatInterval: 10000,
            ...config
        };
    }

    public start(): void {
        if (this.running) return;
        this.running = true;
        this.connect();
    }

    public stop(): void {
        if (!this.running) return;
        this.running = false;
        this.disconnect();
    }

    public isRunning(): boolean {
        return this.running;
    }

    public getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    protected updateConnectionState(newState: ConnectionState): void {
        if (this.connectionState !== newState) {
            console.log(`${this.constructor.name}: Connection state changed from ${this.connectionState} to ${newState}`);
            this.connectionState = newState;

            if (this.onConnectionStateChanged) {
                this.onConnectionStateChanged(newState);
            }
        }
    }

    protected connect(): void {
        if (this.socket?.readyState === WebSocket.OPEN) return;

        this.updateConnectionState(ConnectionState.Connecting);

        try {
            const socket = new WebSocket(this.serverUrl);

            socket.onopen = () => {
                console.log(`${this.constructor.name}: Connected to ${this.serverUrl}`);
                this.updateConnectionState(ConnectionState.Connected);
                this.reconnectAttempts = 0;
                this.clearReconnectTimeout();
                this.setupHeartbeatHandler();
                this.handleConnected();
            };

            socket.onclose = () => {
                console.log(`${this.constructor.name}: Disconnected from ${this.serverUrl}`);
                this.socket = null;
                this.handleDisconnected();

                if (this.running) {
                    this.reconnect();
                } else {
                    this.updateConnectionState(ConnectionState.Disconnected);
                }
            };

            socket.onmessage = (event) => {
                console.log(`Raw message received: ${event.data.substring(0, 100)}...`);
                try {
                    const message = JSON.parse(event.data);
                    this.processMessage(message);
                } catch (error) {
                    console.error(`${this.constructor.name}: Error parsing message`, error);
                }
            };

            socket.onerror = (error) => {
                console.error(`${this.constructor.name}: WebSocket error`, error);
            };

            this.socket = socket;
        } catch (error) {
            console.error(`${this.constructor.name}: Failed to create WebSocket connection`, error);
            if (this.running) {
                this.reconnect();
            } else {
                this.updateConnectionState(ConnectionState.Disconnected);
            }
        }
    }

    protected reconnect(): void {
        this.updateConnectionState(ConnectionState.Reconnecting);

        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.log(`${this.constructor.name}: Max reconnect attempts (${this.config.maxReconnectAttempts}) reached`);
            this.updateConnectionState(ConnectionState.Disconnected);
            return;
        }

        this.reconnectAttempts++;

        const delay = Math.min(
            this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
            this.config.maxReconnectDelay
        );

        console.log(`${this.constructor.name}: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

        this.clearReconnectTimeout();
        this.reconnectTimeout = setTimeout(() => this.connect(), delay);
    }

    protected clearReconnectTimeout(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    protected disconnect(): void {
        this.clearReconnectTimeout();

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
            this.socket.close();
            this.socket = null;
        }

        this.updateConnectionState(ConnectionState.Disconnected);
    }

    protected setupHeartbeatHandler(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'heartbeat_response',
                    timestamp: Date.now()
                }));
            }
        }, this.config.heartbeatInterval);
    }

    protected processMessage(message: any): void {
        // Handle common messages first
        switch (message.type) {
            case 'ping':
                this.sendMessage({
                    type: 'heartbeat_response',
                    originalTimestamp: message.timestamp,
                    timestamp: Date.now()
                });
                return;

            case 'reconnect_request':
                if (this.connectionState !== ConnectionState.Connected) {
                    this.clearReconnectTimeout();
                    this.connect();
                }
                return;

            case 'server_connected':
                console.log(`${this.constructor.name}: Server connected message received`);
                if (message.id) {
                    this.handleServerConnected(message.id, message.name);
                }
                return;
        }

        // If not a common message, delegate to child class implementation
        this.processSpecificMessage(message);
    }


    protected sendMessage(message: any): boolean {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error(`${this.constructor.name}: WebSocket not connected`);
            return false;
        }

        try {
            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error(`${this.constructor.name}: Error sending message`, error);
            return false;
        }
    }

    protected handleServerConnected(_shipId: number, _shipName?: string): void {
        // Base implementation does nothing
    }

    // Abstract methods to be implemented by child classes
    protected abstract processSpecificMessage(message: any): void;
    protected abstract handleConnected(): void;
    protected abstract handleDisconnected(): void;
}