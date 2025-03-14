// ShipContext.tsx - Provides ship data context for the application

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ShipData, ShipStatus, MapConstants } from '../types/Types';
import MockShipSimulator from '../utils/MockShipSimulator';
import { staticShips } from '../utils/StaticShips';

// TODO: Consider single source of truth
// Constants - matching Map.tsx
const MAP_CENTER        : number[]  = [10.570455, 59.425565];
const MAP_SIZE_KM       : number    = 10;
const KM_PER_DEGREE_LAT : number    = 111;
const KM_PER_DEGREE_LON : number    = KM_PER_DEGREE_LAT * Math.cos(MAP_CENTER[1] * Math.PI / 180);

// Calculate offsets separately for latitude and longitude
const LAT_OFFSET        : number    = MAP_SIZE_KM / (2 * KM_PER_DEGREE_LAT);
const LON_OFFSET        : number    = MAP_SIZE_KM / (2 * KM_PER_DEGREE_LON);



// Define the context type
interface ShipContextType {
    ships: ShipData[];
    selectedShipId: number | null;
    selectShip: (id: number | null) => void;
    addShip: (ship: ShipData) => void;
    updateShip: (ship: ShipData) => void;
    removeShip: (id: number) => void;
    constants: MapConstants;
}
const ShipContext = createContext<ShipContextType | null>(null);


interface ShipProviderProps {
    children: ReactNode;
    useMockShips?: boolean;
}


export const ShipProvider: React.FC<ShipProviderProps> =
    ({children, useMockShips = process.env.NODE_ENV === 'development'}) => {
    // Initialize with static ships only
    const [ships, setShips] = useState<ShipData[]>(staticShips);
    const [selectedShipId, setSelectedShipId] = useState<number | null>(null);
    const [mockSimulator, setMockSimulator] = useState<MockShipSimulator | null>(null);

    // Ship selection handler
    const selectShip = useCallback((id: number | null) => {
        setSelectedShipId(id);
    }, []);

    // Ship management methods
    const addShip = useCallback((ship: ShipData) => {
        setShips(currentShips => {
            // Check if ship already exists
            if (currentShips.some(s => s.id === ship.id)) {
                return currentShips;
            }
            return [...currentShips, ship];
        });
    }, []);

    const updateShip = useCallback((updatedShip: ShipData) => {
        setShips(currentShips =>
            currentShips.map(ship =>
                ship.id === updatedShip.id ? updatedShip : ship
            )
        );
    }, []);

    const removeShip = useCallback((id: number) => {
        setShips(currentShips =>
            currentShips.filter(ship => ship.id !== id)
        );
    }, []);

    // Set up mock ship simulator if enabled
    React.useEffect(() => {
        if (useMockShips) {
            const simulator = new MockShipSimulator({
                ships,
                setShips,
                config: {
                    shipCount: 5,
                    updateInterval: 1000,
                    mapCenter: MAP_CENTER as [number, number],
                    mapSizeKm: MAP_SIZE_KM,
                    speedRange: [5, 20]
                }
            });

            simulator.start();
            setMockSimulator(simulator);

            return () => {
                simulator.stop();
            };
        }
    }, [useMockShips]);

    const constants: MapConstants = {
        MAP_CENTER,
        MAP_SIZE_KM,
        KM_PER_DEGREE_LAT,
        KM_PER_DEGREE_LON,
        LAT_OFFSET,
        LON_OFFSET
    };

    return (
        <ShipContext.Provider value={{
            ships,
            selectedShipId,
            selectShip,
            addShip,
            updateShip,
            removeShip,
            constants
        }}>
            {children}
        </ShipContext.Provider>
    );
};

export const useShips = (): ShipContextType => {
    const context = useContext(ShipContext);
    if (!context) {
        throw new Error('useShips must be used within a ShipProvider');
    }
    return context;
};

export default ShipContext;
