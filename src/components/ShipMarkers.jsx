import { useEffect, useRef } from 'react';
import { useShips } from './ShipContext';

const ShipMarkers = ({ map }) => {
    const { ships, selectShip, selectedShipId } = useShips();
    const sourceRef = useRef(null);

    // Initial setup of map layers and images
    useEffect(() => {
        if (!map) return;

        // Create regular ship icon
        const shipImage = new Image(40, 40);
        shipImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#2196F3" fill-opacity="0.6"/>
                <path d="M20 2 L24 38 L20 32 L16 38 L20 2" fill="#0D47A1"/>
            </svg>
        `);

        // Create selected ship icon
        const selectedShipImage = new Image(40, 40);
        selectedShipImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#FF5722" fill-opacity="0.8"/>
                <path d="M20 2 L24 38 L20 32 L16 38 L20 2" fill="#BF360C"/>
                <circle cx="20" cy="20" r="22" fill="none" stroke="#FF5722" stroke-width="2" stroke-dasharray="4,4"/>
            </svg>
        `);

        const initializeLayers = () => {
            console.log('Initializing layers...');

            // Clean up any existing layers
            if (map.getLayer('ships')) map.removeLayer('ships');
            if (map.getLayer('map-background')) map.removeLayer('map-background');
            if (map.getSource('ships')) map.removeSource('ships');
            if (map.getSource('background-source')) map.removeSource('background-source');

            // Add background layer with lower z-index
            map.addLayer({
                id: 'map-background',
                type: 'fill',
                source: 'background-source',
                layout: {},
                paint: {
                    'fill-color': '#ffffff',
                    'fill-opacity': 0
                }
            }, map.getStyle().layers[0].id); // Insert at bottom of layer stack

            // Then add ships source and layer (higher z-index)
            map.addSource('ships', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
            sourceRef.current = 'ships';

            map.addLayer({
                id: 'ships',
                type: 'symbol',
                source: 'ships',
                layout: {
                    'icon-image': [
                        'case',
                        ['==', ['get', 'id'], selectedShipId],
                        'ship-icon-selected',
                        'ship-icon'
                    ],
                    'icon-size': [
                        'case',
                        ['==', ['get', 'id'], selectedShipId],
                        0.6,
                        0.5
                    ],
                    'icon-rotate': ['get', 'heading'],
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true,
                    'text-field': ['get', 'name'],
                    'text-offset': [0, 1.5],
                    'text-anchor': 'top'
                },
                paint: {
                    'text-color': [
                        'case',
                        ['==', ['get', 'id'], selectedShipId],
                        '#FF5722',
                        '#333'
                    ],
                    'text-halo-color': '#fff',
                    'text-halo-width': 2
                }
            });

            // Remove all existing click handlers
            map.off('click');
            map.off('click', 'ships');
            map.off('click', 'map-background');

            // Single click handler for all interactions
            map.on('click', (e) => {
                console.log('Map clicked at:', e.lngLat);

                // Query features at click point
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ['ships']
                });
                console.log('Features at click point:', features);

                // If we clicked a ship, select it
                if (features.length > 0) {
                    selectShip(features[0].properties.id);
                } else {
                    // If we clicked nothing, deselect current ship
                    selectShip(null);
                }
            });

            // Change cursor on hover
            map.on('mouseenter', 'ships', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'ships', () => {
                map.getCanvas().style.cursor = '';
            });
        };

        // Load images and initialize layers
        Promise.all([
            new Promise(resolve => {
                if (!map.hasImage('ship-icon')) {
                    map.addImage('ship-icon', shipImage);
                }
                resolve();
            }),
            new Promise(resolve => {
                if (!map.hasImage('ship-icon-selected')) {
                    map.addImage('ship-icon-selected', selectedShipImage);
                }
                resolve();
            })
        ]).then(initializeLayers);

        return () => {
            if (map) {
                if (map.getLayer('ships')) map.removeLayer('ships');
                if (map.getLayer('map-background')) map.removeLayer('map-background');
                if (map.getSource('ships')) map.removeSource('ships');
                if (map.getSource('background-source')) map.removeSource('background-source');
                sourceRef.current = null;
            }
        };
    }, [map, selectShip]);

    // Update ship positions and selection state
    useEffect(() => {
        if (!map || !sourceRef.current) return;

        // Update layer style for selection
        if (map.getLayer('ships')) {
            map.setLayoutProperty('ships', 'icon-image', [
                'case',
                ['==', ['get', 'id'], selectedShipId],
                'ship-icon-selected',
                'ship-icon'
            ]);

            map.setLayoutProperty('ships', 'icon-size', [
                'case',
                ['==', ['get', 'id'], selectedShipId],
                0.6,
                0.5
            ]);

            map.setPaintProperty('ships', 'text-color', [
                'case',
                ['==', ['get', 'id'], selectedShipId],
                '#FF5722',
                '#333'
            ]);
        }

        // Update source data
        const source = map.getSource(sourceRef.current);
        if (!source) return;

        source.setData({
            type: 'FeatureCollection',
            features: ships.map(ship => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [ship.longitude, ship.latitude]
                },
                properties: {
                    id: ship.id,
                    name: ship.name,
                    heading: ship.heading,
                    speed: ship.speed
                }
            }))
        });
    }, [ships, selectedShipId, map]);

    return null;
};

export default ShipMarkers;