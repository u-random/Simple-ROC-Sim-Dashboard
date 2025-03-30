// src/utils/TelemetryClient.ts


import { BaseSocketClient, ConnectionState } from './BaseSocketClient';
import { ShipData, ShipStatus } from '../types/Types';


interface SimulatorContext {
    ships: ShipData[];
    setShips: (ships: ShipData[] | ((prevShips: ShipData[]) => ShipData[])) => void;
}

export class TelemetryClient extends BaseSocketClient {
    private ships: ShipData[] = [];
    private shipContext: SimulatorContext;
    private shipsDictionary: {[shipId: string]: ShipData} = {};
    private updateInterval: NodeJS.Timeout | null = null;
    private updateRate: number = 500;
    private staleTimeout: number = 5000;

    constructor(
        shipContext: SimulatorContext,
        serverIp: string,
        port: number = 3000,
        onConnectionStateChanged?: (state: ConnectionState) => void
    ) {
        super(serverIp, port, onConnectionStateChanged);
        this.shipContext = shipContext;
    }

    public start(): void {
        super.start();

        // Start update interval for ships
        this.updateInterval = setInterval(() => {
            this.updateShipsInContext();
        }, this.updateRate);
    }

    public stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.removeShipsFromContext();
        super.stop();
    }

    // TODO: Use clearer typing here, especially message const
    // Send control command to a specific ship
    public sendControl(shipId: number, command: object): boolean {
        console.log(`Sending Control ${JSON.stringify(command)} to ${shipId}`);
        
        // Check if controlModeActive exists in the command
        const hasControlMode = (command as any).controlModeActive !== undefined;
        if (hasControlMode) {
            console.log(`Control command includes controlModeActive = ${(command as any).controlModeActive}`);
        } else {
            console.warn(`Control command is missing controlModeActive property!`);
        }
        
        // Create a flattened message structure - don't nest the command inside a property
        const message = {
            type: 'control',
            shipID: shipId.toString(),
            // Add all command properties directly to the message
            ...command
        };
        
        // Double check the final message has the controlModeActive field if it should
        console.log(`Sending flattened message: ${JSON.stringify(message)}`);
        
        if (hasControlMode && message.controlModeActive === undefined) {
            console.error("controlModeActive was lost during message creation!");
        }
        
        return this.sendMessage(message);
    }

    protected handleConnected(): void {
        // Register as ROC client for telemetry
        this.sendMessage({
            type: 'register',
            role: 'roc',
            shipId: 'all',
            clientId: `roc-telemetry-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        });
    }

    protected handleDisconnected(): void {
        this.markAllShipsDisconnected();
    }

    protected processSpecificMessage(message: any): void {
        // Process ship-specific messages
        if (!message.id) return;

        const ship = this.getOrCreateShip(message.id, message.name);

        switch (message.type) {
            case 'telemetry':
                this.updateShipWithTelemetry(ship, message);
                break;
        }
    }

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

    // TODO: Update to process a ship array from message
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
            }
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

    private updateShipsInContext(): void {
        const now = Date.now();

        this.ships = Object.values(this.shipsDictionary).map(ship => {
            const isStale = now - ship.connection.lastUpdated > this.staleTimeout;

            return {
                ...ship,
                status: isStale ? ShipStatus.OFFLINE : ship.status,
                connection: {
                    ...ship.connection,
                    connected: !isStale && ship.connection.connected
                }
            };
        });

        const { ships = [], setShips } = this.shipContext;

        const nonTelemetryShips = ships.filter((ship: ShipData) =>
            !this.ships.some(telemetryShip => telemetryShip.id === ship.id)
        );

        setShips([...nonTelemetryShips, ...this.ships]);
    }

    private removeShipsFromContext(): void {
        const { ships = [], setShips } = this.shipContext;

        const nonTelemetryShips = ships.filter((ship: ShipData) =>
            !this.ships.some(telemetryShip => telemetryShip.id === ship.id)
        );

        setShips(nonTelemetryShips);
    }

    protected handleServerConnected(shipId: number, shipName?: string): void {
        const ship = this.getOrCreateShip(shipId, shipName);
        this.updateShipConnection(ship, true);
    }
}