// src/views/CameraView.tsx - This provides the camera view
// Displaying either a placeholder or a video feed


// TODO: Crop view of image/stream in standard mode
// DO Max width/height toggling.
// TODO: Do also fit to width/height in Ship Overview
// TODO: FIX issue where all ships view the camera feed, so not tied to ship id
// TODO: Hide fit button when width is

import debugTexture from '../assets/Debugempty219.png';
import { useCameraFeed } from '../hooks/useCameraFeed';
import { useEffect, useState } from 'react';




interface CameraViewProps {
    shipId: number | null;
    aspectRatio?: "ultrawide" | "standard";
    isControlMode?: boolean;
    isShipView?: boolean;
    fitMode?: "height" | "width";
}

const isValidBase64 = (str: string): boolean => {
    try {
        //console.log("Frame is valid base64");
        return str.length > 100 && /^[A-Za-z0-9+/=]+$/.test(str);
    } catch {
        console.log("Frame is invalid base64");
        return false;
    }
};

const CameraView = ({
                        shipId,
                        aspectRatio = "standard",
                        isControlMode = false,
                        isShipView = false,
                        fitMode = "height"
                    }: CameraViewProps) => {
    const { frame, isConnected, frameObjectUrl } = useCameraFeed(shipId);
    const [error, setError] = useState<string | null>(null);

    const controlClass = isControlMode ? "control-mode" : "";


    // DEBUG
    useEffect(() => {
        console.log(`CameraView for ship ${shipId}: connected=${isConnected}, frame=${frame ? 'available' : 'not available'}, type=${frame ? (typeof frame === 'string' ? 'string' : 'Blob') : 'null'}`);
        if (frame && typeof frame === 'string') {
            console.log(`Frame length: ${frame.length}, first 20 chars: ${frame.substring(0, 20)}`);
        } else if (frame instanceof Blob) {
            console.log(`Binary frame size: ${frame.size} bytes`);
        }
    }, [shipId, isConnected, frame]);
    
    // Auto-request camera feed when ship changes and no frame is available
    useEffect(() => {
        // If we have a ship ID but no frame and no active connection
        if (shipId && !frame && !isConnected) {
            console.log(`CameraView: Auto-requesting camera feed for ship ${shipId}`);
            
            // Try to find video clients via window
            // @ts-ignore - accessing window property
            const videoClients = window.__shipContext?.videoClients || [];
            
            if (videoClients.length > 0) {
                console.log(`CameraView: Found ${videoClients.length} video clients, requesting camera`);
                videoClients[0].requestCameraFeed(shipId, true);
            } else {
                console.log(`CameraView: No video clients available to request camera feed`);
            }
        }
    }, [shipId, frame, isConnected]);


    return (
        <div className={`camera-container aspect-ratio-${aspectRatio} ${controlClass}`}>
            <div className="camera-frame">
                <div className="camera-content">
                    {/* Add this in your component to display data details */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        color: 'white',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '4px'
                    }}>
                        Frame: {frame ? 
                            (typeof frame === 'string' ? `${frame.length} bytes (base64)` : `${(frame as Blob).size} bytes (binary)`) 
                            : 'none'}
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        color: 'white',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '4px'
                    }}>
                        {!isConnected ? 'Connecting to camera feed...' :
                            error ? `Connection error: ${error}` :
                                'Camera connected'}
                    </div>
                    
                    {/* Display based on frame type */}
                    {frameObjectUrl ? (
                        // Binary frame with object URL
                        <img
                            src={frameObjectUrl}
                            alt={`Camera Feed ${shipId}`}
                            className="camera-texture"
                            style={fitMode !== 'height' ?
                                {width: '100%'} :
                                {height: '100%'}
                            }
                            onError={(e) => console.error("Binary image failed to load", e)}
                        />
                    ) : frame && typeof frame === 'string' && isValidBase64(frame) ? (
                        // Legacy base64 frame
                        <img
                            src={`data:image/jpeg;base64,${frame}`}
                            alt={`Camera Feed ${shipId}`}
                            className="camera-texture"
                            style={fitMode !== 'height' ?
                                {width: '100%'} :
                                {height: '100%'}
                            }
                            onError={(e) => console.error("Base64 image failed to load", e)}
                        />
                    ) : (
                        // Fallback to debug texture
                        <img
                            src={debugTexture}
                            alt={`Camera Feed ${shipId}`}
                            className="camera-texture"
                            style={fitMode !== 'height' ?
                                {width: '100%'} :
                                {height: '100%'}
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraView;