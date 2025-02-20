// This file generate and update JSON style mock ship data
// To simulate actual output from simulator

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// TODO: Setup system that allows for static ships in addition to stream from Unity
// TODO: Incorporate operation codes to ship metadata stream


// Constants - matching Map.jsx
const MAP_CENTER = [10.570455, 59.425565];
const MAP_SIZE_KM = 10;
const KM_PER_DEGREE_LAT = 111;
const KM_PER_DEGREE_LON = KM_PER_DEGREE_LAT * Math.cos(MAP_CENTER[1] * Math.PI / 180);

// Calculate offsets separately for latitude and longitude
const LAT_OFFSET = MAP_SIZE_KM / (2 * KM_PER_DEGREE_LAT);
const LON_OFFSET = MAP_SIZE_KM / (2 * KM_PER_DEGREE_LON);

const ShipContext = createContext(null);

// Mock ship data generator with improved coordinate bounds
const generateMockShips = (numShips) => {
    return Array.from({ length: numShips }, (_, i) => ({
        id: `ship-${i}`,
        name: `Vessel ${i + 1}`,
        // Use separate offsets for longitude and latitude
        longitude: MAP_CENTER[0] + (Math.random() * 2 - 1) * LON_OFFSET * 0.8,
        latitude: MAP_CENTER[1] + (Math.random() * 2 - 1) * LAT_OFFSET * 0.8,
        heading: Math.random() * 360,
        speed: 5 + Math.random() * 15, // 5-20 knots
        course: Math.random() * 360, // True course
        position: 'N/A', // Will be calculated
        status: 'Active'
    }));
};

export const ShipProvider = ({ children }) => {
    const [ships, setShips] = useState(() => generateMockShips(10));
    const [selectedShipId, setSelectedShipId] = useState(null);

    // Update ship positions with corrected degree calculations
    const updateShipPositions = useCallback(() => {
        setShips(currentShips =>
            currentShips.map(ship => {
                // Convert speed from knots to degrees per second, using correct scales
                const speedLonPerSec = ship.speed / (KM_PER_DEGREE_LON * 3600);
                const speedLatPerSec = ship.speed / (KM_PER_DEGREE_LAT * 3600);

                // Calculate new position using different scales for lon/lat
                const headingRad = ship.heading * Math.PI / 180;
                const newLong = ship.longitude +
                    Math.sin(headingRad) * speedLonPerSec;
                const newLat = ship.latitude +
                    Math.cos(headingRad) * speedLatPerSec;

                // Calculate position string
                const position = `${Math.abs(newLat).toFixed(4)}°${newLat >= 0 ? 'N' : 'S'}, ${Math.abs(newLong).toFixed(4)}°${newLong >= 0 ? 'E' : 'W'}`;

                // Optional: Add bounds checking to keep ships within the map area
                const boundedLong = Math.max(MAP_CENTER[0] - LON_OFFSET,
                    Math.min(MAP_CENTER[0] + LON_OFFSET, newLong));
                const boundedLat = Math.max(MAP_CENTER[1] - LAT_OFFSET,
                    Math.min(MAP_CENTER[1] + LAT_OFFSET, newLat));

                return {
                    ...ship,
                    longitude: boundedLong,
                    latitude: boundedLat,
                    heading: ship.heading + (Math.random() * 2 - 1) * 0.1, // Small random heading change
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
                MAP_CENTER,
                MAP_SIZE_KM,
                KM_PER_DEGREE_LAT,
                KM_PER_DEGREE_LON,
                LAT_OFFSET,
                LON_OFFSET
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