// src/pages/ShipOverview.tsx - View Collection, alternative page


// TODO: Control Mode read input
// TODO: Control Mode ESC for exit shortcut
// TODO: Currently viewing ship label, and drop down list/menu
// TODO: Use last selected ship if no active selection
// TODO: Config columns-container to not be 50% of height, but to stretch. Camera container should be fixed height though


import { useShips } from '../hooks/ShipContext';
import CameraView from '../views/CameraView';
import Render3D from '../views/Render3D';
import MiniMap from '../views/MiniMap';
import Conning from '../views/Conning';
import Radar from '../views/Radar';
import React, { useState, useEffect, useRef } from 'react';
import SvgFitHeight from "../components/SvgFitHeight";
import SvgFitWidth from "../components/SvgFitWidth";


interface ShipOverviewProps {
    isControlMode: boolean;
    setIsControlMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const ShipOverview: React.FC<ShipOverviewProps> = ({ isControlMode, setIsControlMode }) => {
    const { selectedShipId, ships, sendControlCommand } = useShips();
    // Get ship from Ship view.
    const displayedShip = ships.find((ship) => ship.id === selectedShipId);
    const [fitMode, setFitMode] = useState<"height" | "width">("width");
    
    // Control state for ship
    const [controlState, setControlState] = useState({
        mainThrottle: 0,
        mainRudder: 0,
        bowThrottle: 0, 
        bowRudder: 0,
        cameraRotation: 0,
        engineMode: "unified" as "unified" | "group",
        engineOn: false,
        controlModeActive: false // New field to toggle Unity's input handling
    });
    
    // Track if control state has changed and needs to be sent
    const [controlStateChanged, setControlStateChanged] = useState(false);
    const lastSentControlState = useRef({...controlState});
    
    // Track pressed keys
    const pressedKeys = useRef<Set<string>>(new Set());
    
    // Initialize control mode on component mount
    useEffect(() => {
        console.log("Component mounted - setting initial controlModeActive to false");
        setControlState(prev => ({
            ...prev,
            controlModeActive: false
        }));
    }, []);
    
    // Access videoClients to request camera feed when a ship is selected
    const [videoClients, setVideoClients] = useState<any[]>([]);

    // Find VideoClients from window object (since we don't have direct access to them here)
    useEffect(() => {
        // Find any available VideoClient instances from window
        const findVideoClients = () => {
            // @ts-ignore - accessing window property
            if (window.__shipContext && window.__shipContext.videoClients) {
                // @ts-ignore - accessing window property
                setVideoClients(window.__shipContext.videoClients);
            } else {
                console.log("No video clients found in window object");
            }
        };
        
        findVideoClients();
        
        // Set up an interval to keep checking (in case they're initialized later)
        const checkInterval = setInterval(() => {
            if (videoClients.length === 0) {
                findVideoClients();
            } else {
                clearInterval(checkInterval);
            }
        }, 1000);
        
        return () => clearInterval(checkInterval);
    }, []);
    
    // Request camera feed when selectedShipId changes
    useEffect(() => {
        if (selectedShipId && displayedShip?.hasCamera && videoClients.length > 0) {
            console.log(`ShipOverview: Requesting camera feed for ship ${selectedShipId}`);
            
            // Use the first available VideoClient to request the camera feed
            videoClients[0].requestCameraFeed(selectedShipId, true);
        }
    }, [selectedShipId, displayedShip?.hasCamera, videoClients.length]);
    
    // Handle keyboard controls
    useEffect(() => {
        // When control mode changes, we need to notify Unity
        if (selectedShipId) {
            console.log(`Control mode changed to: ${isControlMode ? 'ACTIVE' : 'INACTIVE'}`);
            
            // Update the control state with the new mode
            setControlState(prev => {
                const newState = {
                    ...prev,
                    controlModeActive: isControlMode, // Update control mode based on isControlMode prop
                    // Reset controls when toggling modes
                    mainThrottle: 0,
                    mainRudder: 0,
                    bowThrottle: 0,
                    bowRudder: 0
                };
                console.log(`Setting control state with controlModeActive = ${isControlMode}`);
                return newState;
            });
            
            // Always trigger a send immediately when control mode changes
            setTimeout(() => {
                console.log("Forcing send of control state after mode change");
                setControlStateChanged(true);
            }, 50); // Add a slight delay to ensure state is updated
        }
        
        if (!isControlMode || !selectedShipId) return;
        
        // Functions to handle key events
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent default behavior for control keys
            if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'q', 'e', 'Escape'].includes(e.key)) {
                e.preventDefault();
            }
            
            // Add key to pressed keys
            pressedKeys.current.add(e.key);
            
            // Handle mode switch
            if (e.key === 'm') {
                setControlState(prev => ({
                    ...prev,
                    engineMode: prev.engineMode === "unified" ? "group" : "unified"
                }));
            }
            
            // Handle escape key
            if (e.key === 'Escape') {
                setIsControlMode(false);
                
                // Send a final command to release control
                setControlState(prev => ({
                    ...prev,
                    controlModeActive: false,
                    mainThrottle: 0,
                    mainRudder: 0,
                    bowThrottle: 0,
                    bowRudder: 0
                }));
                setControlStateChanged(true); // Force a send
            }
        };
        
        const handleKeyUp = (e: KeyboardEvent) => {
            // Remove key from pressed keys
            pressedKeys.current.delete(e.key);
        };
        
        // Update control values based on pressed keys
        const updateControlValues = () => {
            if (!isControlMode) return;
            
            setControlState(prev => {
                // Start with current state
                const newState = { ...prev };
                
                // Engine 1 controls (WASD)
                const engine1Forward = pressedKeys.current.has('w') ? 1 : 0;
                const engine1Backward = pressedKeys.current.has('s') ? 1 : 0;
                const engine1Left = pressedKeys.current.has('a') ? 1 : 0;
                const engine1Right = pressedKeys.current.has('d') ? 1 : 0;
                
                // Engine 2 controls (Arrow keys)
                const engine2Forward = pressedKeys.current.has('ArrowUp') ? 1 : 0;
                const engine2Backward = pressedKeys.current.has('ArrowDown') ? 1 : 0;
                const engine2Left = pressedKeys.current.has('ArrowLeft') ? 1 : 0;
                const engine2Right = pressedKeys.current.has('ArrowRight') ? 1 : 0;
                
                // Camera controls (Q, E)
                const cameraLeft = pressedKeys.current.has('q') ? 1 : 0;
                const cameraRight = pressedKeys.current.has('e') ? 1 : 0;
                
                // Calculate throttle values (-1 to 1)
                newState.mainThrottle = engine1Forward - engine1Backward;
                newState.mainRudder = engine1Right - engine1Left;
                
                newState.bowThrottle = engine2Forward - engine2Backward;
                newState.bowRudder = engine2Right - engine2Left;

                // Calculate camera rotation (-1 to 1)
                newState.cameraRotation += (cameraRight - cameraLeft) * 0.1;
                
                // Engine state
                newState.engineOn = newState.mainThrottle !== 0 || newState.bowThrottle !== 0;
                
                // Check if state has changed significantly
                const last = lastSentControlState.current;
                const hasChanged = 
                    Math.abs(newState.mainThrottle - last.mainThrottle) > 0.01 ||
                    Math.abs(newState.mainRudder - last.mainRudder) > 0.01 ||
                    Math.abs(newState.bowThrottle - last.bowThrottle) > 0.01 ||
                    Math.abs(newState.bowRudder - last.bowRudder) > 0.01 ||
                    Math.abs(newState.cameraRotation - last.cameraRotation) > 0.05 ||
                    newState.engineMode !== last.engineMode;
                
                if (hasChanged) {
                    setControlStateChanged(true);
                }
                
                return newState;
            });
        };
        
        // Set up interval to send control messages - increase rate to 33ms (30Hz)
        const sendControlInterval = setInterval(() => {
            if (displayedShip && selectedShipId && controlStateChanged) {
                // Log the control state we're sending
                console.log(`Sending control command with controlModeActive=${controlState.controlModeActive}`);
                
                // Send the control command
                sendControlCommand(selectedShipId, controlState);
                
                // Update last sent state and reset changed flag
                lastSentControlState.current = {...controlState};
                setControlStateChanged(false);
                
                // Send a second confirmation if this was a control mode toggle
                if (lastSentControlState.current.controlModeActive !== controlState.controlModeActive) {
                    console.log(`Sending control mode confirmation: ${controlState.controlModeActive}`);
                    // Send a repeat message after a brief delay to ensure it gets through
                    setTimeout(() => {
                        sendControlCommand(selectedShipId, controlState);
                    }, 100);
                }
            }
        }, 33); // Send control updates up to 30 times per second (when changes occur)
        
        // Set up interval for control value updates - faster at 8ms (~120 fps)
        const controlUpdateInterval = setInterval(updateControlValues, 8);
        
        // Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        // Cleanup function
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            clearInterval(sendControlInterval);
            clearInterval(controlUpdateInterval);
            
            // Clear any pressed keys
            pressedKeys.current.clear();
        };
    }, [isControlMode, selectedShipId, displayedShip, setIsControlMode, sendControlCommand]);
    
    return (
        <div className="internal-container ship-view">
            <div className="sub-title">
                Currently Viewing: {displayedShip?.name || 'N/A'}
                {isControlMode && (
                    <span className="control-mode-indicator">
                        [CONTROL MODE: {controlState.engineMode.toUpperCase()}]
                        Press 'M' to toggle engine mode, ESC to exit
                    </span>
                )}
            </div>
            {/* Full Width Camera Container */}
            <div className="camera-wrapper" style={{ position: 'relative' }}>
                <CameraView
                    shipId={selectedShipId}
                    aspectRatio="ultrawide"
                    isControlMode={isControlMode}
                    isShipView={true}
                    fitMode={fitMode}
                />
                <div
                    onClick={() => setFitMode(prev => prev === "height" ? "width" : "height")}
                >
                    {fitMode === "height" ? <SvgFitWidth /> : <SvgFitHeight />}
                </div>

                {/* TODO: Keep the values in view */}
                {isControlMode && (
                    <div className="control-overlay">
                        <div className="control-info">
                            <div>Engine 1: WASD ({controlState.mainThrottle.toFixed(1)}, {controlState.mainRudder.toFixed(1)})</div>
                            <div>Engine 2: Arrows ({controlState.bowThrottle.toFixed(1)}, {controlState.bowRudder.toFixed(1)})</div>
                            <div>Camera: Q/E ({controlState.cameraRotation.toFixed(1)})</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Four Column Layout */}
            <div className="columns-container">
                {/* Conning Info */}
                <Conning
                    isControlMode={isControlMode}
                    setIsControlMode={setIsControlMode}
                />

                {/* Radar View */}
                <Radar/>

                {/* Mini Map */}
                <MiniMap/>

                {/* 3D Model View */}
                <Render3D/>
            </div>
        </div>
    );
};

export default ShipOverview;