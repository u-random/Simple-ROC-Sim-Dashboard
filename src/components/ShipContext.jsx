import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Constants
const OSLO_CENTER = [10.7522, 59.9139];
const MAP_SIZE_KM = 10;
const KM_PER_DEGREE = 111;
const DEGREE_OFFSET = MAP_SIZE_KM / (2 * KM_PER_DEGREE);

const ShipContext = createContext(null);

// Mock ship data generator
const generateMockShips = (numShips) => {
    return Array.from({ length: numShips }, (_, i) => ({
        id: `ship-${i}`,
        name: `Vessel ${i + 1}`,
        longitude: OSLO_CENTER[0] + (Math.random() * 2 - 1) * DEGREE_OFFSET * 0.8,
        latitude: OSLO_CENTER[1] + (Math.random() * 2 - 1) * DEGREE_OFFSET * 0.8,
        heading: Math.random() * 360,
        speed: 5 + Math.random() * 15, // 5-20 knots
        course: Math.random() * 360, // True course
        // Put here additional properties for FleetInfo
        position: 'N/A', // Will be calculated
        status: 'Active'
    }));
};

export const ShipProvider = ({ children }) => {
    // Change the following to increase/decrease the number of ships
    const [ships, setShips] = useState(() => generateMockShips(10));
    const [selectedShipId, setSelectedShipId] = useState(null);

    // Update ship positions
    const updateShipPositions = useCallback(() => {
        setShips(currentShips =>
            currentShips.map(ship => {
                // Convert speed from knots to degrees per second
                const speedDegPerSec = ship.speed / (KM_PER_DEGREE * 3600);

                const newLong = ship.longitude +
                    Math.sin(ship.heading * Math.PI / 180) * speedDegPerSec;
                const newLat = ship.latitude +
                    Math.cos(ship.heading * Math.PI / 180) * speedDegPerSec;

                // Calculate position string
                const position = `${Math.abs(newLat).toFixed(4)}°${newLat >= 0 ? 'N' : 'S'}, ${Math.abs(newLong).toFixed(4)}°${newLong >= 0 ? 'E' : 'W'}`;

                return {
                    ...ship,
                    longitude: newLong,
                    latitude: newLat,
                    heading: ship.heading + (Math.random() * 2 - 1) * 0.1,
                    position
                };
            })
        );
    }, []);

    // Start position updates
    useEffect(() => {
        const interval = setInterval(updateShipPositions, 1000);
        return () => clearInterval(interval);
    }, [updateShipPositions]);

    const selectShip = useCallback((id) => {
        setSelectedShipId(id);
    }, []);

    return (
        <ShipContext.Provider value={{
            ships,
            selectedShipId,
            selectShip,
            constants: {
                OSLO_CENTER,
                MAP_SIZE_KM,
                KM_PER_DEGREE,
                DEGREE_OFFSET
            }
        }}>
            {children}
        </ShipContext.Provider>
    );
};

export const useShips = () => {
    const context = useContext(ShipContext);
    if (!context) {
        throw new Error('useShips must be used within a ShipProvider');
    }
    return context;
};

export default ShipContext;