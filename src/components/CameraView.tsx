

// TODO: Get feed from unity
// TODO: Crop view of image/stream in standard mode

import { useEffect } from "react";
import debugTexture from '../assets/Debugempty219.png';
import { ShipStatus } from '../types/Types';

interface CameraViewProps {
    shipId: number | null;
    aspectRatio?: "ultrawide" | "standard";
    isControlMode?: boolean;
    isShipView?: boolean;
}

/**
 * Simplified Camera View component
 */
const CameraView = ({
                        shipId,
                        aspectRatio = "standard",
                        isControlMode = false,
                        isShipView = false
                    }: CameraViewProps) => {

    useEffect(() => {
        if (window.unityInstance && shipId !== null) {
            window.unityInstance.SendMessage('CameraManager', 'SetActiveCamera', shipId.toString());
        }
    }, [shipId]);

    // TODO: Eliminate function
    // Simple function to get vessel number for display
    const getVesselDisplay = (id: number | null): string => {
        return id !== null ? id.toString() : "Unknown";
    };

    const controlClass = isControlMode ? "control-mode" : "";

    return (
        <div className={`camera-container aspect-ratio-${aspectRatio} ${controlClass}`}>
            <div className="camera-frame">
                <div className="camera-content">
                    <img
                        src={debugTexture}
                        alt={`Camera Feed ${getVesselDisplay(shipId)}`}
                        className="camera-texture"
                    />
                    <div className="camera-placeholder-text">
                        {aspectRatio === "ultrawide" ? "Ultrawide" : "Standard"} Camera
                        Feed {getVesselDisplay(shipId)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Add Window interface extension for Unity
declare global {
    interface Window {
        unityInstance?: {
            SendMessage: (objectName: string, methodName: string, value: string) => void;
        };
    }
}

export default CameraView;