// Ship data type definitions

// Possible states of a ship's operational status
export enum ShipStatus {
    ACTIVE  = 'active',
    DOCKED  = 'docked',
    WARNING = 'warning',
    ERROR   = 'error',
    OFFLINE = 'offline'
}

// Complete ship data structure including position, motion, and connection status
export interface ShipData {
    id      : number;
    name    : string;
    position: {
        longitude: number;
        latitude : number;
    };
    motion: {
        heading : number;        // 0-360 degrees
        speed   : number;        // Knots
        course  : number;        // 0-360 degrees
    };
    status: ShipStatus;
    connection: {
        connected       : boolean;
        lastUpdated     : number;  // Timestamp of last data update
        signalStrength? : number;  // Optional, for future quality metrics
    };
    // STUBS FOR POTENTIAL EXPANSION
    telemetry: {
        // Additional optional sensor data
        rpm?        : number;
        fuelLevel?  : number;
        // Add other sensor data as needed
    };
    cameraFeed?     : string;
}

// Simplified ship data for summary displays
export interface ShipSummary {
    id          : number;
    name        : string;
    status      : ShipStatus;
    connected   : boolean;
}