// src/views/maps/RotatingMap.tsx
// Ship-centered rotating minimap implementation

// TODO: Add option to click on the map to swap between the default zoomed in mode, to a more zoomed out mode


import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BaseMapService } from '../utils/BaseMapService';
import { MapConstants } from '../types/MapConstants';
import { useShips } from '../hooks/ShipContext';
import { useMap } from '../hooks/MapContext';
import { ShipData } from '../types/Types';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibrejs from 'maplibre-gl';


interface RotatingMapProps {
    className?: string;
}

const RotatingMap: React.FC<RotatingMapProps> = ({ className }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapServiceRef = useRef<BaseMapService | null>(null);
    const mapInstanceRef = useRef<maplibrejs.Map | null>(null);
    
    // Track if animation is active
    const isAnimatingRef = useRef<boolean>(false);
    // Track target bearing and current bearing
    const targetBearingRef = useRef<number | null>(null);
    const currentBearingRef = useRef<number>(0);
    // Track target position
    const targetPositionRef = useRef<[number, number] | null>(null);
    // Last ship data ref to maintain state between updates
    const lastShipDataRef = useRef<{
        id: number | null;
        position: [number, number] | null;
        heading: number | null;
        lastUpdated: number;
    }>({
        id: null,
        position: null,
        heading: null,
        lastUpdated: 0
    });
    
    const { registerMap, registerMarkerSource } = useMap();
    const { ships, selectedShipId } = useShips();

    const [selectedShip, setSelectedShip] = useState<ShipData | null>(null);
    const mapId = 'mini';

    // Minimap zoom level - should zoom in more than standard map
    const MINIMAP_ZOOM = MapConstants.INITIAL_ZOOM + 3;
    // Time to maintain last ship position and heading after deselection (ms)
    const POSITION_RETENTION_TIME = 3000;

    // Find the selected ship when selectedShipId changes
    useEffect(() => {
        if (selectedShipId === null) {
            // If we just deselected a ship, note the current time for retention
            if (lastShipDataRef.current.id !== null) {
                lastShipDataRef.current.lastUpdated = Date.now();
            }
            setSelectedShip(null);
            return;
        }

        const ship = ships.find(s => s.id === selectedShipId) || null;
        setSelectedShip(ship);
        
        // Update the last ship data ref
        if (ship) {
            lastShipDataRef.current = {
                id: ship.id,
                position: [ship.position.longitude, ship.position.latitude],
                heading: ship.motion.heading,
                lastUpdated: Date.now()
            };
        }
    }, [selectedShipId, ships]);

    // Initialize map service
    useEffect(() => {
        if (!mapRef.current) return;

        const mapService = new BaseMapService({
            containerId: 'mini-map',
            mapId,
            isRotating: true,
            isMinimap: true,
            initialZoom: MINIMAP_ZOOM
        });

        const mapInstance = mapService.initialize(mapRef.current, {
            containerId: 'mini-map',
            mapId,
            isRotating: true,
            isMinimap: true,
            initialZoom: MINIMAP_ZOOM,
            showAttribution: false
        });

        mapInstanceRef.current = mapInstance;
        mapServiceRef.current = mapService;

        // Disable map interactivity for the minimap
        mapInstance.boxZoom.disable();
        mapInstance.scrollZoom.disable();
        mapInstance.dragPan.disable();
        mapInstance.dragRotate.disable();
        mapInstance.keyboard.disable();
        mapInstance.doubleClickZoom.disable();
        mapInstance.touchZoomRotate.disable();

        // Register map with context
        registerMap(mapId, mapInstance);

        // Setup ship markers when map loads
        mapInstance.on('load', async () => {
            await mapService.setupShipMarkers({
                iconSize: 0.4,
                showLabels: false
            });

            // Register marker source with context
            registerMarkerSource(mapId, mapService.getMarkerSource());

            // Update markers with current ships
            mapService.updateShipMarkers(ships);
        });

        return () => {
            isAnimatingRef.current = false;
            mapService.cleanup();
            registerMap(mapId, null);
            registerMarkerSource(mapId, null);
        };
    }, [registerMap, registerMarkerSource]);

    // Update ship markers when ships change - 
    // But we don't want this to trigger animation
    useEffect(() => {
        if (!mapServiceRef.current) return;
        mapServiceRef.current.updateShipMarkers(ships);
    }, [ships]);

    // Main effect to handle position and rotation updates
    useEffect(() => {
        if (!mapServiceRef.current || !mapInstanceRef.current) return;
        
        // Set the selected ship in the map service
        if (mapServiceRef.current) {
            mapServiceRef.current.setSelectedShip(selectedShipId);
        }
        
        // Check if we have a selected ship
        if (selectedShip) {
            // Update target bearing to match ship's heading (ship faces upward on map)
            // Note: We're not inverting the heading as you mentioned this fixed the direction issue
            targetBearingRef.current = selectedShip.motion.heading;
            
            // Set target position to ship's position
            targetPositionRef.current = [
                selectedShip.position.longitude,
                selectedShip.position.latitude
            ];
            
            // Update last ship data
            lastShipDataRef.current = {
                id: selectedShip.id,
                position: targetPositionRef.current,
                heading: targetBearingRef.current,
                lastUpdated: Date.now()
            };
        } else {
            // No ship selected - check if we should maintain the last position
            const timeSinceLastShip = Date.now() - lastShipDataRef.current.lastUpdated;
            
            if (timeSinceLastShip < POSITION_RETENTION_TIME && lastShipDataRef.current.position) {
                // Maintain last position and heading during retention period
                targetBearingRef.current = lastShipDataRef.current.heading;
                targetPositionRef.current = lastShipDataRef.current.position;
            } else {
                // Reset to default state after retention period
                targetBearingRef.current = 0;
                targetPositionRef.current = MapConstants.MAP_CENTER as [number, number];
                
                // Clear last ship data if we're fully resetting
                if (timeSinceLastShip >= POSITION_RETENTION_TIME) {
                    lastShipDataRef.current = {
                        id: null,
                        position: null,
                        heading: null,
                        lastUpdated: 0
                    };
                }
            }
        }
        
        // Start animation if not already running
        if (!isAnimatingRef.current) {
            startAnimation();
        }
    }, [selectedShip, selectedShipId]);
    
    // Animation function with direct rotation setting
    const animateFrame = useCallback(() => {
        if (!isAnimatingRef.current || !mapInstanceRef.current) return;
        
        const map = mapInstanceRef.current;
        let shouldContinue = false;
        
        // Set rotation directly without animation
        if (targetBearingRef.current !== null) {
            // Just set the bearing directly - no animation needed
            map.setBearing(targetBearingRef.current);
        }
        
        // Handle position - much faster animation
        if (targetPositionRef.current) {
            // Just set center directly for immediate feedback
            map.setCenter(targetPositionRef.current);
        }
        
        // Check again in a short interval to catch any new updates
        setTimeout(() => {
            if (isAnimatingRef.current) {
                requestAnimationFrame(animateFrame);
            }
        }, 50); // Short interval to quickly react to ship movements
    }, []);
    
    // Start the animation loop
    const startAnimation = useCallback(() => {
        if (isAnimatingRef.current) return;
        
        isAnimatingRef.current = true;
        requestAnimationFrame(animateFrame);
    }, [animateFrame]);

    return (
        <div className="map-wrapper">
            <div
                className="minimap-container"
                ref={mapRef}
            />
            {selectedShip ? (
                <div className="overlay-layer">
                    {/* Compass design as a circular indicator */}
                    <div className="map-compass">

                    </div>
                </div>
            ) : (
                <div className="overlay-layer">
                    <div className="map-text">
                        Select a ship
                    </div>
                </div>
            )}
        </div>
    );
};

export default RotatingMap;