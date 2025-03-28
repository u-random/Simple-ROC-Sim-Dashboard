// src/utils/BaseMapService.ts
// Core map functionality shared between different map implementations

import maplibregl from 'maplibre-gl';
import { MapConstants } from '../types/MapConstants';
import { ShipData } from '../types/Types';

// Types
export interface MapOptions {
    containerId: string;
    mapId: string;
    isRotating?: boolean;
    isMinimap?: boolean;
    initialZoom?: number;
    maxBounds?: [[number, number], [number, number]];
    center?: [number, number];
    showAttribution?: boolean;
}

export interface MarkerOptions {
    defaultIconUrl?: string;
    selectedIconUrl?: string;
    iconSize?: number;
    showLabels?: boolean;
}

export class BaseMapService {
    private map: maplibregl.Map | null = null;
    private sourceId: string;
    private layerId: string;
    private selectedShipId: number | null = null;
    private onSelectShip: ((id: number | null) => void) | null = null;
    private markersConfigured: boolean = false;
    private isRotating: boolean;
    private isMinimap: boolean;

    constructor(options: MapOptions) {
        this.sourceId = `ships-${options.mapId}`;
        this.layerId = `ships-layer-${options.mapId}`;
        this.isRotating = options.isRotating || false;
        this.isMinimap = options.isMinimap || false;
    }

    /**
     * Initialize a new map instance
     */
    public initialize(
        container: HTMLElement,
        options: MapOptions,
        onMapReady?: (map: maplibregl.Map) => void
    ): maplibregl.Map {
        const map = new maplibregl.Map({
            container,
            style: `https://api.maptiler.com/maps/topo/style.json?key=${import.meta.env.VITE_OPENMAPTILES_KEY}`,
            center: options.center || MapConstants.MAP_CENTER,
            zoom: options.initialZoom || (this.isMinimap ? 
                MapConstants.INITIAL_ZOOM + 1 : MapConstants.INITIAL_ZOOM),
            maxBounds: options.maxBounds || MapConstants.MAX_BOUNDS,
            minZoom: MapConstants.MIN_ZOOM,
            maxZoom: MapConstants.MAX_ZOOM,
            preserveDrawingBuffer: true,
            bearing: 0,
            attributionControl: options.showAttribution !== false
        });

        this.map = map;

        map.on('load', () => {
            this.setupBoundsVisualization();

            if (!this.isMinimap) {
                this.addControls();
            }

            if (onMapReady) {
                onMapReady(map);
            }
        });

        return map;
    }

    /**
     * Set up the map with ship markers
     */
    public async setupShipMarkers(markerOptions: MarkerOptions = {}): Promise<void> {
        if (!this.map || this.markersConfigured) return;

        try {
            const map = this.map;
            
            // Load default ship marker
            await this.loadMapImage('ship-icon', markerOptions.defaultIconUrl || this.getDefaultShipIcon());
            
            // Load selected ship marker
            await this.loadMapImage('ship-icon-selected', markerOptions.selectedIconUrl || this.getSelectedShipIcon());

            // Add source for ship markers
            map.addSource(this.sourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            // Configure rotation expression based on map type
            const iconRotateExpression = this.isRotating
                ? ['case',
                    ['==', ['get', 'id'], this.selectedShipId],
                    0, // Fixed orientation for selected ship in a rotating map
                    ['get', 'heading']
                ]
                : ['get', 'heading'];

            // Add layer for ship markers
            map.addLayer({
                id: this.layerId,
                type: 'symbol',
                source: this.sourceId,
                layout: {
                    'icon-image': [
                        'case',
                        ['==', ['get', 'id'], this.selectedShipId],
                        'ship-icon-selected',
                        'ship-icon'
                    ],
                    'icon-size': markerOptions.iconSize || (this.isMinimap ? 0.4 : 0.6),
                    'icon-rotate': iconRotateExpression,
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true,
                    'text-field': (markerOptions.showLabels === false || this.isMinimap) ? '' : ['get', 'name'],
                    'text-offset': [0, 1.5],
                    'text-anchor': 'top',
                    'text-allow-overlap': false,
                    'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                    'text-radial-offset': 1.5,
                    'text-size': 16,
                    'text-font': ['Open Sans 600'],
                },
                paint: {
                    'text-color': [
                        'case',
                        ['==', ['get', 'id'], this.selectedShipId],
                        '#FF5722',
                        '#000000'
                    ],
                    'text-halo-color': [
                        'case',
                        ['==', ['get', 'id'], this.selectedShipId],
                        '#000000',
                        '#ffffff'
                    ],
                    'text-halo-width': 1,
                    'text-halo-blur': 1,
                }
            });

            // Add click handlers for standard maps (non-minimap)
            if (!this.isMinimap) {
                this.setupEventHandlers();
            }

            this.markersConfigured = true;
        } catch (error) {
            console.error('Error setting up ship markers:', error);
        }
    }

    /**
     * Update ship markers on the map
     */
    public updateShipMarkers(ships: ShipData[]): void {
        if (!this.map || !this.markersConfigured) return;

        try {
            const source = this.map.getSource(this.sourceId) as maplibregl.GeoJSONSource;

            if (source) {
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
                        speed: ship.motion.speed,
                        course: ship.motion.course,
                        status: ship.status,
                        connected: ship.connection.connected
                    }
                }));

                source.setData({
                    type: 'FeatureCollection',
                    features
                });
            }
        } catch (error) {
            console.error('Error updating ship markers:', error);
        }
    }

    /**
     * Set or update the selected ship
     */
    public setSelectedShip(shipId: number | null): void {
        this.selectedShipId = shipId;

        if (!this.map || !this.markersConfigured) return;

        // Update icon image and text styles
        this.updateMarkerStyles();
    }

    /**
     * Center map on a specific ship
     */
    public centerOnShip(ship: ShipData | null, options: { zoom?: number, bearing?: number | null, duration?: number } = {}): void {
        if (!this.map || !ship) return;

        const easeOptions: maplibregl.EaseToOptions = {
            center: [ship.position.longitude, ship.position.latitude],
            duration: options.duration || 300
        };

        if (options.zoom !== undefined) {
            easeOptions.zoom = options.zoom;
        }

        if (options.bearing !== undefined && options.bearing !== null) {
            easeOptions.bearing = options.bearing;
        }

        this.map.easeTo(easeOptions);
    }

    /**
     * Register a callback for ship selection
     */
    public onShipSelect(callback: (id: number | null) => void): void {
        this.onSelectShip = callback;
    }

    /**
     * Clean up map resources
     */
    public cleanup(): void {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        this.markersConfigured = false;
    }

    /**
     * Get the map instance
     */
    public getMap(): maplibregl.Map | null {
        return this.map;
    }

    /**
     * Get the source for the ship markers
     */
    public getMarkerSource(): maplibregl.GeoJSONSource | null {
        if (!this.map || !this.markersConfigured) return null;
        return this.map.getSource(this.sourceId) as maplibregl.GeoJSONSource;
    }

    // Private helper methods

    private async loadMapImage(id: string, iconUrl: string): Promise<void> {
        if (!this.map) return;
        
        const map = this.map;
        const image = new Image();
        image.src = iconUrl;
        
        return new Promise<void>(resolve => {
            image.onload = () => {
                map.addImage(id, image);
                resolve();
            };
        });
    }

    private getDefaultShipIcon(): string {
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#2196F3" fill-opacity="0.6"/>
              <path d="M20 2 L24 38 L20 32 L16 38 L20 2" fill="#0D47A1"/>
            </svg>
        `);
    }

    private getSelectedShipIcon(): string {
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#FF5722" fill-opacity="0.8"/>
              <path d="M20 2 L24 38 L20 32 L16 38 L20 2" fill="#BF360C"/>
              <circle cx="20" cy="20" r="22" fill="none" stroke="#FF5722" stroke-width="2"/>
            </svg>
        `);
    }

    private updateMarkerStyles(): void {
        if (!this.map) return;

        const map = this.map;

        // Update icon image
        map.setLayoutProperty(this.layerId, 'icon-image', [
            'case',
            ['==', ['get', 'id'], this.selectedShipId],
            'ship-icon-selected',
            'ship-icon'
        ]);

        // Update text color
        map.setPaintProperty(this.layerId, 'text-color', [
            'case',
            ['==', ['get', 'id'], this.selectedShipId],
            '#FF5722',
            '#000000'
        ]);

        // Update text shadow
        map.setPaintProperty(this.layerId, 'text-halo-color', [
            'case',
            ['==', ['get', 'id'], this.selectedShipId],
            '#000000',
            '#ffffff'
        ]);
    }

    private setupEventHandlers(): void {
        if (!this.map) return;

        const map = this.map;

        map.on('click', this.layerId, (e: maplibregl.MapMouseEvent & {
            features?: maplibregl.MapGeoJSONFeature[]
        }) => {
            if (e.features && e.features.length > 0) {
                const shipId = e.features[0].properties?.id;
                this.selectedShipId = shipId;

                if (this.onSelectShip) {
                    this.onSelectShip(shipId);
                }

                e.originalEvent.stopPropagation();
            }
        });

        // Deselect ship when clicking elsewhere on the map
        map.on('click', (e: maplibregl.MapMouseEvent) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: [this.layerId]
            });

            if (features.length === 0) {
                this.selectedShipId = null;

                if (this.onSelectShip) {
                    this.onSelectShip(null);
                }
            }
        });
    }

    private setupBoundsVisualization(): void {
        if (!this.map) return;

        const map = this.map;
        const maxBounds = MapConstants.MAX_BOUNDS;

        map.addSource('bounds', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [maxBounds[0][0], maxBounds[0][1]],
                        [maxBounds[1][0], maxBounds[0][1]],
                        [maxBounds[1][0], maxBounds[1][1]],
                        [maxBounds[0][0], maxBounds[1][1]],
                        [maxBounds[0][0], maxBounds[0][1]]
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
    }

    private addControls(): void {
        if (!this.map) return;

        this.map.addControl(
            new maplibregl.NavigationControl({ showCompass: false }),
            'bottom-right'
        );

        this.map.addControl(
            new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }),
            'bottom-left'
        );
    }
}