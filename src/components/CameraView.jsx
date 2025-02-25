import { useEffect } from "react";
import debugTexture from '../assets/Debugempty219.png';

/**
 * Simplified Camera View component
 * @param {Object} props Component props
 * @param {string} props.shipId - The ID of the ship to display camera for
 * @param {string} props.aspectRatio - "ultrawide" (21:9) or "standard" (16:9)
 * @param {boolean} props.isControlMode - Whether the camera is in control mode
 * @param {boolean} props.isShipView - Whether this is the main ship view
 */
const CameraView = ({
                        shipId,
                        aspectRatio = "standard",
                        isControlMode = false,
                        isShipView = false
                    }) => {
    useEffect(() => {
        if (window.unityInstance) {
            window.unityInstance.SendMessage('CameraManager', 'SetActiveCamera', shipId);
        }
    }, [shipId]);

    const getVesselNumber = (id) => {
        const match = id.match(/\d+/);
        return match ? (parseInt(match[0]) + 1).toString() : "Unknown";
    };

    const controlClass = isControlMode ? "control-mode" : "";

    return (
        <div className={`camera-container aspect-ratio-${aspectRatio} ${controlClass}`}>
            <div className="camera-frame">
                    <div className="camera-content">
                        <img
                            src={debugTexture}
                            alt={`Camera Feed ${getVesselNumber(shipId)}`}
                            className="camera-texture"
                        />
                        <div className="camera-placeholder-text">
                            {aspectRatio === "ultrawide" ? "Ultrawide" : "Standard"} Camera
                            Feed {getVesselNumber(shipId)}
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default CameraView;