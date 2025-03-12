// This file creates SVG icons and labels to act as ship marker
// It uses the data from ShipContext

// TODO: OK - Fix bug with ship markers disappearing when stacked close together
// TODO: Zoom to selected ship?

import { useEffect, useRef, useCallback } from 'react';
import { useShips } from './ShipContext';


const ShipMarkers = ({ map, minimap = false }) => {
    const { ships, selectShip, selectedShipId } = useShips();
    const sourceRef = useRef(null);
    const layerRef = useRef(null);

    const setupMarkerImages = useCallback(async (map) => {
        if (!map.hasImage('ship-icon')) {
            const shipImage = new Image();
            shipImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#2196F3" fill-opacity="0.6"/>
                    <path d="M20 2 L24 38 L20 32 L16 38 L20 2" fill="#0D47A1"/>
                </svg>
            `);
            await new Promise((resolve) => {
                shipImage.onload = () => {
                    map.addImage('ship-icon', shipImage);
                    resolve();
                };
            });
        }

        if (!map.hasImage('ship-icon-selected')) {
            const selectedImage = new Image();
            selectedImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#FF5722" fill-opacity="0.8"/>
                    <path d="M20 2 L24 38 L20 32 L16 38 L20 2" fill="#BF360C"/>
                    <circle cx="20" cy="20" r="22" fill="none" stroke="#FF5722" stroke-width="2"/>
                </svg>
            `);
            await new Promise((resolve) => {
                selectedImage.onload = () => {
                    map.addImage('ship-icon-selected', selectedImage);
                    resolve();
                };
            });
        }
    }, []);

    useEffect(() => {
        if (!map || !map.loaded()) return;

        const sourceId = `ships-${minimap ? 'mini' : 'main'}`;
        const layerId = `ships-layer-${minimap ? 'mini' : 'main'}`;

        const setup = async () => {
            try {
                await setupMarkerImages(map);

                if (!map.getSource(sourceId)) {
                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: []
                        }
                    });
                    sourceRef.current = sourceId;
                }

                if (!map.getLayer(layerId)) {
                    map.addLayer({
                        id: layerId,
                        type: 'symbol',
                        source: sourceId,
                        layout: {
                            'icon-image': [
                                'case',
                                ['==', ['get', 'id'], selectedShipId],
                                'ship-icon-selected',
                                'ship-icon'
                            ],
                            'icon-size': minimap ? 0.4 : 0.6,
                            'icon-rotate': ['get', 'heading'],
                            'icon-allow-overlap': true,
                            'icon-ignore-placement': true,
                            'text-field': minimap ? '' : ['get', 'name'],
                            'text-offset': [0, 1.5],
                            'text-anchor': 'top'
                        }
                    });
                    layerRef.current = layerId;

                    if (!minimap) {
                        map.on('click', layerId, (e) => {
                            if (e.features.length > 0) {
                                selectShip(e.features[0].properties.id);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error setting up ship markers:', error);
            }
        };

        setup();

        return () => {
            if (map && map.loaded()) {
                if (map.getLayer(layerRef.current)) {
                    if (!minimap) {
                        map.off('click', layerRef.current);
                    }
                    map.removeLayer(layerRef.current);
                }
                if (map.getSource(sourceRef.current)) {
                    map.removeSource(sourceRef.current);
                }
                sourceRef.current = null;
                layerRef.current = null;
            }
        };
    }, [map, minimap, selectedShipId, setupMarkerImages]);

    useEffect(() => {
        if (!map || !map.loaded() || !sourceRef.current) return;

        const source = map.getSource(sourceRef.current);
        if (!source) return;

        const features = ships.map(ship => ({
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
        }));

        source.setData({
            type: 'FeatureCollection',
            features
        });
    }, [ships, map]);

    return null;
};

export default ShipMarkers;