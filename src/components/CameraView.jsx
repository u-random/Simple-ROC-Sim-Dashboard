import {useEffect} from "react";

const CameraView = ({ shipId }) => {

    // Unity stuff. TODO
    useEffect(() => {
        if (window.unityInstance) {
            // Connect to Unity WebGL instance
            window.unityInstance.SendMessage('CameraManager', 'SetActiveCamera', shipId);
        }
    }, [shipId]);

    // Extract the number from "ship-X" format and add 1
    const getVesselNumber = (id) => {
        const match = id.match(/\d+/);  // Extract number from string
        if (match) {
            return (parseInt(match[0]) + 1).toString();
        }
        return "Unknown";
    };

    return (
        <div className="camera-container">
            <div className="camera-frame">
                <div className="camera-content">
                    {/* Placeholder for Unity WebGL stream */}
                    <div className="camera-placeholder">
                        Camera Feed {getVesselNumber(shipId)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CameraView;