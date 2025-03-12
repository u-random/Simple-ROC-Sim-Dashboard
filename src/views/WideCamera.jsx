import CameraView from "../components/CameraView";


const WideCamera = ({ isControlMode }) => {

    // SECTION HTML
    return (
        <div className="container-100">
            <div className="camera-wrapper">
                <CameraView shipId="1" isControlMode={isControlMode}/>
            </div>
        </div>
    );
};
// END SECTION HTML
export default WideCamera;