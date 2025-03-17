// src/utils/UnityShipSimulator.ts - The main WebSocket data provider


import { ShipData, ShipStatus } from '../types/Types';


// Connection state enum for better state management
export enum ConnectionState {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Connected = 'connected',
    Reconnecting = 'reconnecting'
}

export interface UnityShipConfig {
    updateInterval: number; // in milliseconds to check for stale ships
    staleTimeout: number;   // in milliseconds to mark ships as stale
    reconnectInterval: number; // base reconnect interval in milliseconds
    maxReconnectAttempts: number; // maximum number of reconnection attempts
    maxReconnectDelay: number; // maximum delay between reconnection attempts
    heartbeatInterval: number; // interval for responding to heartbeats
}

interface SimulatorContext {
    ships: ShipData[];
    setShips: (ships: ShipData[] | ((prevShips: ShipData[]) => ShipData[])) => void;
}

export default class UnityShipSimulator {
    private ships: ShipData[] = [];
    private updateInterval: NodeJS.Timeout | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private shipContext: SimulatorContext;
    private running: boolean = false;
    private connectionState: ConnectionState = ConnectionState.Disconnected;
    private connectUnity: boolean = false;
    private socket: WebSocket | null = null;
    private serverUrl: string;
    private config: UnityShipConfig;
    private shipsDictionary: {[shipId: string]: ShipData} = {};
    private reconnectAttempts: number = 0;
    private onConnectionStateChanged: ((state: ConnectionState) => void) | null = null;
    private onCameraFrameReceived: ((shipId: number, frameData: string) => void) | null = null;

    constructor(
        shipContext: SimulatorContext,
        serverUrl: string,
        useUnityShips: boolean,
        onCameraFrameReceived?: (shipId: number, frameData: string) => void,
        onConnectionStateChanged?: (state: ConnectionState) => void,
        config?: Partial<UnityShipConfig>
    ) {
        this.shipContext = shipContext;
        this.serverUrl = `ws://${serverUrl}:3000`;
        this.connectUnity = useUnityShips;
        this.onCameraFrameReceived = onCameraFrameReceived || null;
        this.onConnectionStateChanged = onConnectionStateChanged || null;

        // Default configuration with reconnection parameters
        this.config = {
            updateInterval: 500,
            staleTimeout: 5000,
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

        // Start update interval
        this.updateInterval = setInterval(() => {
            this.updateShipsInContext();
        }, this.config.updateInterval);
    }

    public stop(): void {
        if (!this.running) return;

        this.running = false;
        this.disconnect();

        // Clear intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // Remove ships from context
        this.removeShipsFromContext();
    }

    public isRunning(): boolean {
        return this.running;
    }

    public getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    private updateConnectionState(newState: ConnectionState): void {
        if (this.connectionState !== newState) {
            console.log(`UnityShipSimulator: Connection state changed from ${this.connectionState} to ${newState}`);
            this.connectionState = newState;

            if (this.onConnectionStateChanged) {
                this.onConnectionStateChanged(newState);
            }
        }
    }

    private connect(): void {
        if (this.socket?.readyState === WebSocket.OPEN) return;
        if (!this.connectUnity) return;

        // Update state to connecting
        this.updateConnectionState(ConnectionState.Connecting);

        try {
            const socket = new WebSocket(this.serverUrl);

            socket.onopen = () => {
                console.log(`UnityShipSimulator: Connected to ${this.serverUrl}`);
                this.updateConnectionState(ConnectionState.Connected);
                this.reconnectAttempts = 0;

                // Clear any reconnect timeout
                this.clearReconnectTimeout();

                // Register as ROC
                socket.send(JSON.stringify({
                    type: 'register',
                    role: 'roc',
                    shipId: 'all',
                    clientId: `roc-${Date.now()}-${Math.floor(Math.random() * 1000)}`
                }));

                // Setup heartbeat interval for simple response
                this.setupHeartbeatHandler();
            };

            socket.onclose = () => {
                console.log(`UnityShipSimulator: Disconnected from ${this.serverUrl}`);
                this.socket = null;

                // Mark all ships as disconnected
                this.markAllShipsDisconnected();

                // Attempt to reconnect if still running
                if (this.running) {
                    this.reconnect();
                } else {
                    this.updateConnectionState(ConnectionState.Disconnected);
                }
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.processMessage(message);
                } catch (error) {
                    console.error('UnityShipSimulator: Error parsing message', error);
                }
            };

            socket.onerror = (error) => {
                console.error('UnityShipSimulator: WebSocket error', error);
            };

            this.socket = socket;
        } catch (error) {
            console.error('UnityShipSimulator: Failed to create WebSocket connection', error);

            // Attempt to reconnect if still running
            if (this.running) {
                this.reconnect();
            } else {
                this.updateConnectionState(ConnectionState.Disconnected);
            }
        }
    }

    private setupHeartbeatHandler(): void {
        // Clear any existing heartbeat interval
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Setup interval to check for heartbeats
        this.heartbeatInterval = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                // Send simple heartbeat response
                this.socket.send(JSON.stringify({
                    type: 'heartbeat_response',
                    timestamp: Date.now()
                }));
            }
        }, this.config.heartbeatInterval);
    }

    private reconnect(): void {
        // Update state to reconnecting
        this.updateConnectionState(ConnectionState.Reconnecting);

        // Check max reconnect attempts
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.log(`UnityShipSimulator: Max reconnect attempts (${this.config.maxReconnectAttempts}) reached`);
            this.updateConnectionState(ConnectionState.Disconnected);
            return;
        }

        this.reconnectAttempts++;

        // Calculate delay with exponential backoff
        const delay = Math.min(
            this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
            this.config.maxReconnectDelay
        );

        console.log(`UnityShipSimulator: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

        // Set timeout for reconnection
        this.clearReconnectTimeout();
        this.reconnectTimeout = setTimeout(() => this.connect(), delay);
    }

    private clearReconnectTimeout(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    private disconnect(): void {
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

    private markAllShipsDisconnected(): void {
        Object.keys(this.shipsDictionary).forEach(shipId => {
            this.shipsDictionary[shipId] = {
                ...this.shipsDictionary[shipId],
                status: ShipStatus.OFFLINE,
                connection: {
                    ...this.shipsDictionary[shipId].connection,
                    connected: false,
                    lastUpdated: Date.now()
                }
            };
        });
    }

    // BEGIN MESSAGE PROCESSING
    private processMessage(message: any): void {
        // Handle heartbeat messages
        if (message.type === 'ping') {
            this.handleHeartbeat(message);
            return;
        }

        // Handle reconnect requests
        if (message.type === 'reconnect_request') {
            this.handleReconnectRequest();
            return;
        }

        if (!message.id) return;

        // Get or create ship record
        const ship = this.getOrCreateShip(message.id, message.name);

        switch (message.type) {
            case 'telemetry':
                this.updateShipWithTelemetry(ship, message);
                if (message.cameraFeed && this.onCameraFrameReceived) {
                    this.onCameraFrameReceived(message.id, message.cameraFeed);
                }
                break;
            case 'simulator_connected':
                this.updateShipConnection(ship, true);
                break;
            case 'simulator_disconnected':
                this.updateShipConnection(ship, false);
                break;
        }
    }

    private handleHeartbeat(message: any): void {
        // Simple heartbeat response
        if (this.socket?.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify({
                    type: 'heartbeat_response',
                    originalTimestamp: message.timestamp,
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.error('UnityShipSimulator: Error sending heartbeat response', error);
            }
        }
    }

    private handleReconnectRequest(): void {
        // Attempt to reconnect immediately when requested by server
        if (this.connectionState !== ConnectionState.Connected) {
            this.clearReconnectTimeout();
            this.connect();
        }
    }

    // Rest of your existing methods...
    // (getOrCreateShip, updateShipWithTelemetry, updateShipConnection, etc.)

    private getOrCreateShip(id: number, name?: string): ShipData {
        if (!this.shipsDictionary[id]) {
            this.shipsDictionary[id] = {
                id: id,
                name: name || `Ship ${id}`,
                position: { longitude: 0, latitude: 0 },
                motion: { heading: 0, speed: 0, course: 0 },
                status: ShipStatus.ACTIVE,
                connection: {
                    connected: false,
                    lastUpdated: Date.now(),
                    signalStrength: 100
                },
                telemetry: {}
            };
        }
        return this.shipsDictionary[id];
    }

    private updateShipWithTelemetry(ship: ShipData, message: any): void {
        this.shipsDictionary[ship.id] = {
            ...ship,
            name: message.name || ship.name,
            position: {
                longitude: message.position?.longitude || ship.position.longitude,
                latitude: message.position?.latitude || ship.position.latitude
            },
            motion: {
                heading: message.motion?.heading || ship.motion.heading,
                speed: message.motion?.speed || ship.motion.speed,
                course: message.motion?.course || message.motion?.heading || ship.motion.course
            },
            connection: {
                ...ship.connection,
                connected: true,
                lastUpdated: Date.now()
            },
            telemetry: {
                ...ship.telemetry,
                ...message.telemetry
            },
            ...(message.cameraFeed && { cameraFeed: message.cameraFeed })
        };
    }

    private updateShipConnection(ship: ShipData, isConnected: boolean): void {
        this.shipsDictionary[ship.id] = {
            ...ship,
            status: isConnected ? ShipStatus.ACTIVE : ShipStatus.OFFLINE,
            connection: {
                ...ship.connection,
                connected: isConnected,
                lastUpdated: Date.now()
            }
        };
    }

    private updateShipsInContext(): void {
        // Get current time for stale checks
        const now = Date.now();

        // Convert from dictionary to array and check for stale ships
        this.ships = Object.values(this.shipsDictionary).map(ship => {
            const isStale = now - ship.connection.lastUpdated > this.config.staleTimeout;

            return {
                ...ship,
                status: isStale ? ShipStatus.OFFLINE : ship.status,
                connection: {
                    ...ship.connection,
                    connected: !isStale && ship.connection.connected
                }
            };
        });

        // Get current ships from context
        const { ships = [], setShips } = this.shipContext;

        // Filter out existing Unity ships
        const nonUnityShips = ships.filter((ship: ShipData) =>
            !this.ships.some(unityShip => unityShip.id === ship.id)
        );

        // Add updated Unity ships
        setShips([...nonUnityShips, ...this.ships]);
    }

    private removeShipsFromContext(): void {
        const { ships = [], setShips } = this.shipContext;

        // Filter out Unity ships
        const nonUnityShips = ships.filter((ship: ShipData) =>
            !this.ships.some(unityShip => unityShip.id === ship.id)
        );

        setShips(nonUnityShips);
    }

    // Send control command to a specific ship
    public sendControl(shipId: number, command: any): boolean {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('UnityShipSimulator: WebSocket not connected');
            return false;
        }

        try {
            const message = {
                type: 'control',
                id: shipId,
                command
            };

            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('UnityShipSimulator: Error sending message', error);
            return false;
        }
    }
}