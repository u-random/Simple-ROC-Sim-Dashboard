// import RenderTexture from "../assets/FerryRender.png";
import React, {MutableRefObject, useRef} from 'react';
import Movie from "../assets/FerryRender.webm";


const Render3D: React.FC = () => {
    const videoRef: MutableRefObject<HTMLVideoElement | null> = useRef<HTMLVideoElement | null>(null);

    // Mouse event handlers for playback control
    const handleMouseEnter = (): void => {
        if (videoRef.current) videoRef.current.play()
    };
    const handleMouseLeave = (): void => {
        if (videoRef.current) videoRef.current.pause();

    };

    return (
        <div className="container-25">
            <div className="list-header">3D MODEL</div>
            <div className="model-container">
                {/* Placeholder for 3D model/image toggle
                <div className="placeholder">3D Model View</div>*/}
                {/* Image element
                <img
                    src={RenderTexture}
                    alt={`Ferry Render`}
                    className="render-texture"
                />*/}
                <video
                    ref={videoRef}
                    src={Movie}
                    loop
                    muted
                    playsInline
                    className="render-texture"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                />
            </div>
        </div>
    );
};

export default Render3D;