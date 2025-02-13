import { useState, useRef, useEffect } from 'react';
import maplibrejs from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import ShipMarkers from '../components/ShipMarkers';

// Constants
const OSLO_CENTER = [10.7522, 59.9139];
const MAP_SIZE_KM = 10;
const KM_PER_DEGREE = 111; // Approximate at Oslo's latitude
const DEGREE_OFFSET = MAP_SIZE_KM / (2 * KM_PER_DEGREE); // Divide by 2 for radius

const MIN_ZOOM = 12;
const MAX_ZOOM = 16;
const INITIAL_ZOOM = 14;

// Calculate bounds
const MAX_BOUNDS = [
    [OSLO_CENTER[0] - DEGREE_OFFSET, OSLO_CENTER[1] - DEGREE_OFFSET], // Southwest
    [OSLO_CENTER[0] + DEGREE_OFFSET, OSLO_CENTER[1] + DEGREE_OFFSET]  // Northeast
];

const Map = () => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || map) return;

        const mapInstance = new maplibrejs.Map({
            container: mapRef.current,
            style: `https://api.maptiler.com/maps/topo/style.json?key=${import.meta.env.VITE_OPENMAPTILES_KEY}`,
            center: OSLO_CENTER,
            zoom: INITIAL_ZOOM,
            maxBounds: MAX_BOUNDS,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            preserveDrawingBuffer: true
        });

        // Add navigation controls
        mapInstance.addControl(
            new maplibrejs.NavigationControl({
                showCompass: false
            }),
            'bottom-right'
        );

        // Add scale control
        mapInstance.addControl(
            new maplibrejs.ScaleControl({
                maxWidth: 100,
                unit: 'metric'
            }),
            'bottom-left'
        );

        // Wait for map to load
        mapInstance.on('load', () => {
            console.log('Map loaded');
            setIsMapLoaded(true);

            // Add bounds visualization
            mapInstance.addSource('bounds', {
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

            mapInstance.addLayer({
                id: 'bounds-line',
                type: 'line',
                source: 'bounds',
                paint: {
                    'line-color': '#FF0000',
                    'line-width': 2,
                    'line-dasharray': [2, 2]
                }
            });
        });

        mapInstance.on('error', (e) => {
            console.error('Map error:', e);
        });

        setMap(mapInstance);

        return () => {
            mapInstance.remove();
            setMap(null);
            setIsMapLoaded(false);
        };
    }, []);


    return (
        <div className="container-50">
            <div className="map-wrapper">
                {/* Main map container */}
                <div className="map-container"
                     ref={mapRef}
                     style={{ pointerEvents: 'auto' }} // Ensure clicks are detected
                />

                {/* Ship Markers */}
                {map && isMapLoaded && <ShipMarkers map={map} />}

                {/* Info overlay */}
                <div className="overlay-layer">
                    <div className="map-text">
                        OSLOFJORD - {MAP_SIZE_KM}km x {MAP_SIZE_KM}km
                        <br/>
                        Center: {OSLO_CENTER[1].toFixed(4)}°N, {OSLO_CENTER[0].toFixed(4)}°E
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Map;