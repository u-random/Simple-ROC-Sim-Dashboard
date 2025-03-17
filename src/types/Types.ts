// src/types/Types.ts - Shared interfaces definitions


import { MapConstantsType } from './MapConstants';


// === Ship data type definitions === //

// Possible states of a ship's operational status
import {ReactNode} from "react";

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
    // STUBS FOR POTENTIAL EXPANSION:
    telemetry: {
        // Additional optional sensor data
        rpm?        : number;
        fuelLevel?  : number;
        engine1LocalRotation?: number;
        engine2LocalRotation?: number;
        // Add other sensor data as needed
    };
    // TODO: ADD TEST FOR THIS IN CAMERA VIEW: USE DEFAULT NO CONNECTION IF NOT SET
    cameraFeed?     : string;
}

// Simplified ship data for summary displays
export interface ShipSummary {
    id          : number;
    name        : string;
    status      : ShipStatus;
    connected   : boolean;
}

// Define the context type
export interface ShipContextType {
    ships: ShipData[];
    selectedShipId: number | null;
    selectShip: (id: number | null) => void;
    addShip: (ship: ShipData) => void;
    updateShip: (ship: ShipData) => void;
    removeShip: (id: number) => void;
    constants: MapConstantsType;
    //simulators: (MockShipSimulator | UnityShipSimulator)[];
    getCameraFrame: (shipId: number) => string | null;
    subscribeToCameraFrames: (shipId: number, callback: (frame: string) => void) => () => void;
}

export interface ShipProviderProps {
    children: ReactNode;
    useMockShips?: boolean;
    connectUnity?: boolean;
    ipAddresses?: string[];
}



// === Settings argument interface definitions === //

export interface SettingsPopupProps {
    show: boolean;
    onClose: () => void;

    // States from App.tsx
    ipAddresses: string[];
    setIpAddresses: (ips: string[]) => void;
    selectedIp: string;
    setSelectedIp: (ip: string) => void;
    connectUnity: boolean;
    setConnectUnity: (connect: boolean) => void;
}