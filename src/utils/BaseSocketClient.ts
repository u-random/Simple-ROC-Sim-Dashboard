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

        // Default configuration with more resilient values
        this.config = {
            reconnectInterval: 1000,        // Start reconnecting more quickly
            maxReconnectAttempts: 10,       // More attempts before giving up
            maxReconnectDelay: 10000,       // Cap at 10 seconds between attempts
            heartbeatInterval: 5000,        // More frequent heartbeat to detect disconnections
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
            // Set binary type to arraybuffer for better handling of binary messages
            const socket = new WebSocket(this.serverUrl);
            socket.binaryType = 'arraybuffer';

            socket.onopen = () => {
                console.log(`${this.constructor.name}: Connected to ${this.serverUrl}`);
                this.updateConnectionState(ConnectionState.Connected);
                this.reconnectAttempts = 0;
                this.clearReconnectTimeout();
                this.setupHeartbeatHandler();
                this.handleConnected();
            };

            socket.onclose = (event) => {
                console.log(`${this.constructor.name}: Disconnected from ${this.serverUrl} with code ${event.code}, reason: ${event.reason || 'Unknown'}`);
                this.socket = null;
                this.handleDisconnected();

                if (this.running) {
                    console.log(`${this.constructor.name}: Will attempt reconnection`);
                    this.reconnect();
                } else {
                    this.updateConnectionState(ConnectionState.Disconnected);
                }
            };

            socket.onmessage = (event) => {
                // Update last message timestamp for connection monitoring
                this.updateLastMessageTime();
                
                // Check if the message is binary or text
                if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
                    const size = event.data instanceof ArrayBuffer ? event.data.byteLength : event.data.size;
                    console.log(`${this.constructor.name}: Binary message received: ${size} bytes`);
                    this.processBinaryMessage(event.data);
                } else {
                    console.log(`${this.constructor.name}: Text message received`);
                    
                    try {
                        // Check if the message is empty or not valid JSON
                        if (!event.data || event.data.trim() === '') {
                            console.warn(`${this.constructor.name}: Received empty message`);
                            return;
                        }
                        
                        const message = JSON.parse(event.data);
                        
                        // Check if the parsed message is valid
                        if (message === null || typeof message !== 'object') {
                            console.warn(`${this.constructor.name}: Parsed message is not an object: ${event.data}`);
                            return;
                        }
                        
                        this.processMessage(message);
                    } catch (error) {
                        console.error(`${this.constructor.name}: Error parsing message: ${error}`, error);
                        console.error(`${this.constructor.name}: Raw message content: ${event.data}`);
                    }
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

    // Track the last time we received any message (text or binary)
    private lastMessageTime: number = 0;
    
    // Update message timestamp whenever we receive any data
    protected updateLastMessageTime(): void {
        this.lastMessageTime = Date.now();
    }
    
    protected setupHeartbeatHandler(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        // Initialize the last message time
        this.lastMessageTime = Date.now();

        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();
            
            // Check if we haven't received any message for twice the heartbeat interval
            // This helps detect "zombie" connections that appear open but aren't receiving data
            if (this.lastMessageTime > 0 && 
                now - this.lastMessageTime > this.config.heartbeatInterval * 2) {
                console.warn(`${this.constructor.name}: No messages received for ${now - this.lastMessageTime}ms, reconnecting...`);
                this.reconnect();
                return;
            }
            
            // Normal heartbeat logic
            if (this.socket?.readyState === WebSocket.OPEN) {
                try {
                    this.socket.send(JSON.stringify({
                        type: 'heartbeat_response',
                        timestamp: now
                    }));
                    console.log(`${this.constructor.name}: Heartbeat sent`);
                } catch (err) {
                    console.error(`${this.constructor.name}: Failed to send heartbeat:`, err);
                    // Attempt to reconnect if heartbeat fails
                    this.reconnect();
                }
            } else if (this.socket?.readyState === WebSocket.CLOSING || 
                      this.socket?.readyState === WebSocket.CLOSED || 
                      !this.socket) {
                console.warn(`${this.constructor.name}: Socket not open during heartbeat (state: ${this.socket?.readyState})`);
                // Attempt to reconnect
                this.reconnect();
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

    // Default binary message handler - override in subclasses
    protected processBinaryMessage(_data: ArrayBuffer | Blob): void {
        console.warn(`${this.constructor.name}: Binary message not handled by default implementation`);
    }

    // Abstract methods to be implemented by child classes
    protected abstract processSpecificMessage(message: any): void;
    protected abstract handleConnected(): void;
    protected abstract handleDisconnected(): void;
}