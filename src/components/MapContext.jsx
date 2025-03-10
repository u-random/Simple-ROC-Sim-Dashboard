import { createContext, useContext, useState, useCallback } from 'react';

const MapContext = createContext(null);

export const MapProvider = ({ children }) => {
    const [mapInstances, setMapInstances] = useState({
        main: null,
        mini: null
    });

    const [markerSources, setMarkerSources] = useState({
        main: null,
        mini: null
    });

    const registerMap = useCallback((id, mapInstance) => {
        setMapInstances(prev => ({
            ...prev,
            [id]: mapInstance
        }));
    }, []);

    const registerMarkerSource = useCallback((id, source) => {
        setMarkerSources(prev => ({
            ...prev,
            [id]: source
        }));
    }, []);

    const updateShipMarkers = useCallback((ships) => {
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

export const useMap = () => {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error('useMap must be used within a MapProvider');
    }
    return context;
};