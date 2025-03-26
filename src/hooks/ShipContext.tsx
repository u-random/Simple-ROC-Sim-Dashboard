// ShipContext.tsx - Provides ship data context for the application


// TODO: process.env.NODE_ENV === 'development' set up in ENV file
// TODO: Use props in ShipProvider input and do a spread on call


import React, { createContext, useContext, useState, useEffect, useRef, useCallback, Context } from 'react';
import { ShipData, ShipContextType, ShipProviderProps } from '../types/Types';
import { MapConstantsType, MapConstants } from '../types/MapConstants';
import MockShipSimulator from '../utils/MockShipSimulator';

import { TelemetryClient } from '../utils/TelemetryClient';
import { VideoClient } from '../utils/VideoClient';
import { staticShips } from '../utils/StaticShips';


const ShipContext: Context<ShipContextType | null> = createContext<ShipContextType | null>(null);

export const ShipProvider: React.FC<ShipProviderProps> =
    //({children, useMockShips = process.env.NODE_ENV === 'development', ipAddresses = []}) => {
    ({children, useMockShips = true, connectUnity = false, ipAddresses = []}) => {
        // Initialize with static ships only
        const [ships, setShips] = useState<ShipData[]>(staticShips);
        const [selectedShipId, setSelectedShipId] = useState<number | null>(null);
        //const [mockSimulator, setMockSimulator] = useState<MockShipSimulator | null>(null);
        const [simulators, setSimulators] = useState<(MockShipSimulator)[]>([]);
        // Setup for multiple Unity servers = multiple clients
        const [telemetryClients, setTelemetryClients] = useState<TelemetryClient[]>([]);
        const [videoClients, setVideoClients]         = useState<VideoClient[]>([]);


        const [cameraFeeds, setCameraFeeds] = useState<{[key: string]: string}>({});
        const cameraSubscriptions = useRef<{[key: string]: Set<(frame: string) => void>}>({});

        //console.log("useUnityShips", useUnityShips);

        // Ship selection handler
        const selectShip = useCallback((id: number | null) => {
            setSelectedShipId(id);
        }, []);

        // Ship management methods
        const addShip = useCallback((ship: ShipData) => {
            setShips(currentShips => {
                // Check if ship already exists
                if (currentShips.some(s => s.id === ship.id)) {
                    return currentShips;
                }
                return [...currentShips, ship];
            });
        }, []);

        const updateShip = useCallback((updatedShip: ShipData) => {
            setShips(currentShips =>
                currentShips.map(ship =>
                    ship.id === updatedShip.id ? updatedShip : ship
                )
            );
        }, []);

        const removeShip = useCallback((id: number) => {
            setShips(currentShips =>
                currentShips.filter(ship => ship.id !== id)
            );
        }, []);


        // Callback function used in VideoClient.ts: Sends data through pub/sub pattern to useCameraFeed hook
        const handleCameraMessage = useCallback((shipId: number, frameData: string) => {
            console.log(`ShipContext: Received camera frame for ship ${shipId}, length: ${frameData.length}`);
            setCameraFeeds(prev => {
                console.log(`ShipContext: Updating camera feeds for ship ${shipId}`);
                return {...prev, [shipId]: frameData};
            });

            if (cameraSubscriptions.current[shipId]) {
                console.log(`ShipContext: Notifying ${cameraSubscriptions.current[shipId].size} subscribers for ship ${shipId}`);
            } else {
                console.warn(`ShipContext: No subscribers for ship ${shipId}`);
            }

            // Notify subscribers
            if (cameraSubscriptions.current[shipId]) {
                cameraSubscriptions.current[shipId].forEach(callback => callback(frameData));
            }
        }, []);

        // Expose these methods
        const getCameraFrame = useCallback((shipId: number) => {
            return cameraFeeds[shipId] || null;
        }, [cameraFeeds]);

        const subscribeToCameraFrames = useCallback((shipId: number, callback: (frame: string) => void) => {
            console.log(`Adding subscriber for ship ${shipId}`);

            if (!shipId) {
                console.warn("Cannot subscribe with null shipId");
                return () => {};
            }

            if (!cameraSubscriptions.current[shipId]) {
                cameraSubscriptions.current[shipId] = new Set();
            }

            cameraSubscriptions.current[shipId].add(callback);

            // Send current frame immediately if available
            const currentFrame = cameraFeeds[shipId];
            if (currentFrame) {
                callback(currentFrame);
            }

            return () => {
                console.log(`Removing subscriber for ship ${shipId}`);
                if (cameraSubscriptions.current[shipId]) {
                    cameraSubscriptions.current[shipId].delete(callback);
                }
            };
        }, [cameraFeeds]);


        // Handle simulator creation and cleanup
        useEffect(() => {
            // Clear any existing simulators first
            simulators.forEach(sim => sim.stop());

            // Clear any existing clients
            telemetryClients.forEach(client => client.stop());
            videoClients.forEach(client => client.stop());

            let newTelemetryClients: TelemetryClient[] = [];
            let newVideoClients: VideoClient[] = [];
            let newMockSimulators: MockShipSimulator[] = [];

            if (useMockShips) {
                const mockSim = new MockShipSimulator({
                    ships,
                    setShips,
                    config: {
                        shipCount: 5,
                        updateInterval: 1000,
                        mapCenter: MapConstants.MAP_CENTER as [number, number],
                        mapSizeKm: MapConstants.MAP_SIZE_KM,
                        speedRange: [5, 20]
                    }
                });
                newMockSimulators.push(mockSim);
            } else if (connectUnity && ipAddresses && ipAddresses.length > 0) {
                // Create clients for each IP
                ipAddresses
                    .filter(ip => ip) // Filter out empty entries
                    .forEach(ip => {
                        try {
                            // Create telemetry client (port 3000)
                            const telemetryClient = new TelemetryClient(
                                { ships, setShips },
                                ip
                            );
                            newTelemetryClients.push(telemetryClient);

                            // Create video client (port 3001)
                            const videoClient = new VideoClient(
                                ip,
                                3001,
                                handleCameraMessage // passing callback
                            );
                            newVideoClients.push(videoClient);
                        } catch (error) {
                            console.error(`Failed to create clients for ${ip}:`, error);
                        }
                    });
            } else {
                console.log("No clients or simulators created");
            }

            // Start all clients and simulators
            newMockSimulators.forEach(sim => sim.start());
            newTelemetryClients.forEach(client => client.start());
            newVideoClients.forEach(client => client.start());

            setSimulators(newMockSimulators);
            setTelemetryClients(newTelemetryClients);
            setVideoClients(newVideoClients);

            // Cleanup function
            return () => {
                newMockSimulators.forEach(sim => sim.stop());
                newTelemetryClients.forEach(client => client.stop());
                newVideoClients.forEach(client => client.stop());
            };
        }, [useMockShips, connectUnity, ipAddresses ? ipAddresses.join(',') : '', handleCameraMessage]);

        const constants: MapConstantsType = MapConstants;

        return (
            <ShipContext.Provider value={{
                ships,
                selectedShipId,
                selectShip,
                addShip,
                updateShip,
                removeShip,
                constants,
                getCameraFrame,
                subscribeToCameraFrames
            }}>
                {children}
            </ShipContext.Provider>
        );
    };

export const useShips = (): ShipContextType => {
    const context = useContext(ShipContext);
    if (!context) {
        throw new Error('useShips must be used within a ShipProvider');
    }
    return context;
};

export default ShipContext;
