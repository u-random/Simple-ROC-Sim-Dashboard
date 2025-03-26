// src/views/CameraView.tsx - This provides the camera view
// Displaying either a placeholder or a video feed


// TODO: Crop view of image/stream in standard mode
// DO Max width/height toggling.
// TODO: Do also fit to width/height in Ship Overview
// TODO: FIX issue where all ships view the camera feed, so not tied to ship id


import debugTexture from '../assets/Debugempty219.png';
import { useCameraFeed } from '../hooks/useCameraFeed';
import { useEffect, useState } from 'react';


interface CameraViewProps {
    shipId: number | null;
    aspectRatio?: "ultrawide" | "standard";
    isControlMode?: boolean;
    isShipView?: boolean;
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
                        isShipView = false
                    }: CameraViewProps) => {
    const { frame, isConnected } = useCameraFeed(shipId);
    const [error, setError] = useState<string | null>(null);

    const controlClass = isControlMode ? "control-mode" : "";


    // DEBUG
    useEffect(() => {
        console.log(`CameraView for ship ${shipId}: connected=${isConnected}, frame=${frame ? 'available' : 'not available'}`);
        if (frame) {
            console.log(`Frame length: ${frame.length}, first 20 chars: ${frame.substring(0, 20)}`);
        }
    }, [shipId, isConnected, frame]);


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
                        Frame: {frame ? `${frame.length} bytes` : 'none'}
                    </div>
                    {frame && isValidBase64(frame) ? (
                        <img
                            src={`data:image/jpeg;base64,${frame}`}
                            alt={`Camera Feed ${shipId}`}
                            className="camera-video"
                            style={{maxWidth: '100%', maxHeight: '100%'}}
                            onError={(e) => console.error("Image failed to load", e)}
                        />

                    ) : (
                        <>
                            <img
                                src={debugTexture}
                                alt={`Camera Feed ${shipId}`}
                                className="camera-texture"
                            />
                            <div className="camera-status-overlay">
                                {!isConnected ? 'Connecting to camera feed...' :
                                    error ? `Connection error: ${error}` :
                                        'No camera connection'}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraView;