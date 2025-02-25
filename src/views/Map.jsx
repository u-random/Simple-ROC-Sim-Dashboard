// This file is the stand-alone Map view
// Using a configured MapLibre/MapTiles to draw the actual map

// TODO: Add centering button
// TODO: Add in Kystverket ocean depth contour/colors as GeoJSON overlay
// TODO: Fix selection of markers in z stack

import { useRef, useEffect, useCallback } from 'react';
import maplibrejs from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useShips } from '../components/ShipContext';
import { useMap } from '../components/MapContext';


// Constants
const MAP_CENTER = [10.570455, 59.425565];
const MAP_SIZE_KM = 12;
const KM_PER_DEGREE_LAT = 111;
const KM_PER_DEGREE_LON = KM_PER_DEGREE_LAT * Math.cos(MAP_CENTER[1] * Math.PI / 180);
const LAT_OFFSET = MAP_SIZE_KM / (2 * KM_PER_DEGREE_LAT);
const LON_OFFSET = MAP_SIZE_KM / (2 * KM_PER_DEGREE_LON);
const MIN_ZOOM = 9;
const MAX_ZOOM = 16;
const INITIAL_ZOOM = 9;
const MAX_BOUNDS = [
    [MAP_CENTER[0] - LON_OFFSET, MAP_CENTER[1] - LAT_OFFSET],
    [MAP_CENTER[0] + LON_OFFSET, MAP_CENTER[1] + LAT_OFFSET]
];

const Map = ({ minimap = false }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const { registerMap, registerMarkerSource, updateShipMarkers } = useMap();
    const { ships, selectedShipId, selectShip } = useShips();
    const mapId = minimap ? 'mini' : 'main';
    const layerConfigured = useRef(false);

    const layerStyle = {
        // Symbol layout properties
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
        'text-anchor': 'top',
        'text-allow-overlap': false, // Prevent text overlap while allowing icons to overlap
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'], // Allow text to find best position
        'text-radial-offset': 1.5, // Offset text from icon center
        'text-size': 16,
        'text-font': ['Open Sans 600'],
        };


    const setupMap = useCallback(async (map) => {
        if (!map || layerConfigured.current) return;

        try {
            // Default ship marker image
            const shipIcon = new Image();
            shipIcon.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#2196F3" fill-opacity="0.6"/>
                    <path d="M20 2 L24 38 L20 32 L16 38 L20 2" fill="#0D47A1"/>
                </svg>
            `);
            await new Promise(resolve => {
                shipIcon.onload = () => {
                    map.addImage('ship-icon', shipIcon);
                    resolve();
                };
            });

            // Alternate ship marker image (Orange if selected)
            const selectedIcon = new Image();
            selectedIcon.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#FF5722" fill-opacity="0.8"/>
                    <path d="M20 2 L24 38 L20 32 L16 38 L20 2" fill="#BF360C"/>
                    <circle cx="20" cy="20" r="22" fill="none" stroke="#FF5722" stroke-width="2"/>
                </svg>
            `);
            await new Promise(resolve => {
                selectedIcon.onload = () => {
                    map.addImage('ship-icon-selected', selectedIcon);
                    resolve();
                };
            });

            // Add source and layer
            const sourceId = `ships-${mapId}`;
            map.addSource(sourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            registerMarkerSource(mapId, map.getSource(sourceId));

            map.addLayer({
                id: `ships-layer-${mapId}`,
                type: 'symbol',
                source: sourceId,
                layout: layerStyle,
                paint: {
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 1,
                    'text-halo-blur': 1,
                }
            });

            // Add click handlers for main map
            if (!minimap) {
                map.on('click', `ships-layer-${mapId}`, (e) => {
                    if (e.features.length > 0) {
                        selectShip(e.features[0].properties.id);
                        e.originalEvent.stopPropagation();
                    }
                });

                map.on('click', (e) => {
                    const features = map.queryRenderedFeatures(e.point, {
                        layers: [`ships-layer-${mapId}`]
                    });
                    if (features.length === 0) {
                        selectShip(null);
                    }
                });
            }

            layerConfigured.current = true;
        } catch (error) {
            console.error('Error setting up map:', error);
        }
    }, [mapId, minimap, registerMarkerSource, selectShip]);

    // Initial map setup
    useEffect(() => {
        if (!mapRef.current) return;

        const map = new maplibrejs.Map({
            container: mapRef.current,
            style: `https://api.maptiler.com/maps/topo/style.json?key=${import.meta.env.VITE_OPENMAPTILES_KEY}`,
            center: MAP_CENTER,
            zoom: minimap ? INITIAL_ZOOM + 1 : INITIAL_ZOOM,
            maxBounds: MAX_BOUNDS,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            preserveDrawingBuffer: true
        });

        mapInstance.current = map;
        registerMap(mapId, map);

        map.on('load', () => {
            setupMap(map);
            updateShipMarkers(ships);

            // Add bounds visualization
            map.addSource('bounds', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [MAX_BOUNDS[0][0], MAX_BOUNDS[0][1]],
                            [MAX_BOUNDS[1][0], MAX_BOUNDS[0][1]],
                            [MAX_BOUNDS[1][0], MAX_BOUNDS[1][1]],
                            [MAX_BOUNDS[0][0], MAX_BOUNDS[1][1]],
                            [MAX_BOUNDS[0][0], MAX_BOUNDS[0][1]]
                        ]]
                    }
                }
            });

            map.addLayer({
                id: 'bounds-line',
                type: 'line',
                source: 'bounds',
                paint: {
                    'line-color': '#FF0000',
                    'line-width': 2,
                    'line-dasharray': [2, 2]
                }
            });

            // Add controls for main map
            if (!minimap) {
                map.addControl(
                    new maplibrejs.NavigationControl({ showCompass: false }),
                    'bottom-right'
                );
                map.addControl(
                    new maplibrejs.ScaleControl({ maxWidth: 100, unit: 'metric' }),
                    'bottom-left'
                );
            }
        });

        return () => {
            layerConfigured.current = false;
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
                registerMap(mapId, null);
                registerMarkerSource(mapId, null);
            }
        };
    }, [mapId, minimap, registerMap, setupMap]);

    // Update markers positions
    useEffect(() => {
        updateShipMarkers(ships);
    }, [ships, updateShipMarkers]);

    // Update selection state
    useEffect(() => {
        const map = mapInstance.current;
        if (!map || !map.loaded() || !layerConfigured.current) return;

        const layerId = `ships-layer-${mapId}`;
        if (map.getLayer(layerId)) {
            // Update icon image
            map.setLayoutProperty(layerId, 'icon-image', [
                'case',
                ['==', ['get', 'id'], selectedShipId],
                'ship-icon-selected',
                'ship-icon'
            ]);

            // Update text color
            map.setPaintProperty(layerId, 'text-color', [
                'case',
                ['==', ['get', 'id'], selectedShipId],
                '#FF5722',
                '#000000'
            ]);

            // Update text Shadow to dark when selected
            map.setPaintProperty(layerId, 'text-halo-color', [
                'case',
                ['==', ['get', 'id'], selectedShipId],
                '#000000',
                '#ffffff'
            ]);
        }
    }, [selectedShipId, mapId]);

    return (
        <div className={minimap ? "container-25" : "container-50"}>
            <div className="map-wrapper">
                <div
                    className={minimap ? "minimap-container" : "map-container"}
                    ref={mapRef}
                />
                {!minimap && (
                    <div className="overlay-layer">
                        <div className="map-text">
                            Horten - {MAP_SIZE_KM}km x {MAP_SIZE_KM}km
                            <br/>
                            Center: {MAP_CENTER[1].toFixed(4)}°N, {MAP_CENTER[0].toFixed(4)}°E
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Map;