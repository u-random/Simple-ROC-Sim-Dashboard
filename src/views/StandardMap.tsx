// src/views/maps/StandardMap.tsx
// Standard non-rotating map implementation

// TODO: Consider enhancements to the focus on current ship approach
// TODO: Consider having some state of zoom to be persistent, so it returns to that after page switch


import { BaseMapService } from '../utils/BaseMapService';
import { MapConstants } from '../types/MapConstants';
import React, { useRef, useEffect } from 'react';
import { useShips } from '../hooks/ShipContext';
import { useMap } from '../hooks/MapContext';
import 'maplibre-gl/dist/maplibre-gl.css';


interface StandardMapProps {
    className?: string;
}

const StandardMap: React.FC<StandardMapProps> = ({ className }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapServiceRef = useRef<BaseMapService | null>(null);

    const { registerMap, registerMarkerSource } = useMap();
    const { ships, selectedShipId, selectShip } = useShips();

    const mapId = 'main';

    // Initialize map service
    useEffect(() => {
        if (!mapRef.current) return;

        // Create map service instance
        const mapService = new BaseMapService({
            containerId: 'standard-map',
            mapId,
            isRotating: false,
            isMinimap: false
        });

        // Initialize the map
        const mapInstance = mapService.initialize(mapRef.current, {
            containerId: 'standard-map',
            mapId,
            isRotating: false,
            isMinimap: false,
            initialZoom: MapConstants.INITIAL_ZOOM
        });

        mapServiceRef.current = mapService;

        // Register map with context
        registerMap(mapId, mapInstance);

        // Register ship selection handler
        mapService.onShipSelect(selectShip);

        // Setup ship markers when map loads
        mapInstance.on('load', async () => {
            await mapService.setupShipMarkers({
                iconSize: 0.6,
                showLabels: true
            });

            // Register marker source with context
            registerMarkerSource(mapId, mapService.getMarkerSource());

            // Update markers with current ships
            mapService.updateShipMarkers(ships);
        });

        return () => {
            mapService.cleanup();
            registerMap(mapId, null);
            registerMarkerSource(mapId, null);
        };
    }, [registerMap, registerMarkerSource, selectShip]);

    // Update ship markers when ships change
    useEffect(() => {
        if (!mapServiceRef.current) return;
        mapServiceRef.current.updateShipMarkers(ships);
    }, [ships]);

    // Update selected ship
    useEffect(() => {
        if (!mapServiceRef.current) return;
        mapServiceRef.current.setSelectedShip(selectedShipId);
        
        // If a ship is selected, center on it without rotation
        if (selectedShipId !== null && mapServiceRef.current) {
            const ship = ships.find(s => s.id === selectedShipId);
            if (ship) {
                mapServiceRef.current.centerOnShip(ship, { 
                    duration: 500,
                    // Don't change zoom or bearing for standard map
                });
            }
        }
    }, [selectedShipId, ships]);

    return (
        <div className={`container-50 ${className || ''}`}>
            <div className="map-wrapper">
                <div
                    className="map-container"
                    ref={mapRef}
                />
                <div className="overlay-layer">
                    <div className="map-text">
                        Horten - {MapConstants.MAP_SIZE_KM}km x {MapConstants.MAP_SIZE_KM}km
                        <br/>
                        Center: {MapConstants.MAP_CENTER[1].toFixed(4)}°N, {MapConstants.MAP_CENTER[0].toFixed(4)}°E
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StandardMap;