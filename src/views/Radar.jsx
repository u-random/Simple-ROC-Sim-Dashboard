import radarTexture from '../assets/Radar.png';

const Radar = () => {

    // SECTION HTML
    return (
        <div className="container-25">
            <div className="list-header">RADAR</div>
            <div className="radar-container">
                {/* Placeholder for radar component <div className="placeholder">Radar View</div>*/}
                <img
                    src={radarTexture}
                    className="radar-texture"
                />

            </div>
        </div>
    );
};
// END SECTION HTML
export default Radar;