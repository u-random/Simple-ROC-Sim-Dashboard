// src/hooks/MapContext.tsx - Context provider for map related stuff, like ship markers


// TODO: Consider using Types interface


import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';


// Define map instance type (adjust based on actual map library you're using)
type MapInstance = any;

// Define marker source type (adjust based on actual implementation)
type MarkerSource = any;

// Define ship type for updating markers
interface ShipPosition {
    latitude: number;
    longitude: number;
}

interface ShipMotion {
    heading: number;
    speed: number;
}

interface Ship {
    id: string;
    name: string;
    position: ShipPosition;
    motion: ShipMotion;
}

interface MapContextType {
    mapInstances: {
        [key: string]: MapInstance | null;
    };
    registerMap: (id: string, mapInstance: MapInstance) => void;
    markerSources: {
        [key: string]: MarkerSource | null;
    };
    registerMarkerSource: (id: string, source: MarkerSource) => void;
    updateShipMarkers: (ships: Ship[]) => void;
}

interface MapProviderProps {
    children: ReactNode;
}

const MapContext = createContext<MapContextType | null>(null);

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
    const [mapInstances, setMapInstances] = useState<{[key: string]: MapInstance | null}>({
        main: null,
        mini: null
    });

    const [markerSources, setMarkerSources] = useState<{[key: string]: MarkerSource | null}>({
        main: null,
        mini: null
    });

    const registerMap = useCallback((id: string, mapInstance: MapInstance) => {
        setMapInstances(prev => ({
            ...prev,
            [id]: mapInstance
        }));
    }, []);

    const registerMarkerSource = useCallback((id: string, source: MarkerSource) => {
        setMarkerSources(prev => ({
            ...prev,
            [id]: source
        }));
    }, []);

    const updateShipMarkers = useCallback((ships: Ship[]) => {
        Object.entries(markerSources).forEach(([id, source]) => {
            if (source) {
                source.setData({
                    type: 'FeatureCollection',
                    features: ships.map(ship => ({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [ship.position.longitude, ship.position.latitude]
                        },
                        properties: {
                            id: ship.id,
                            name: ship.name,
                            heading: ship.motion.heading,
                            speed: ship.motion.speed
                        }
                    }))
                });
            }
        });
    }, [markerSources]);

    return (
        <MapContext.Provider value={{
            mapInstances,
            registerMap,
            markerSources,
            registerMarkerSource,
            updateShipMarkers
        }}>
            {children}
        </MapContext.Provider>
    );
};

export const useMap = (): MapContextType => {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error('useMap must be used within a MapProvider');
    }
    return context;
};