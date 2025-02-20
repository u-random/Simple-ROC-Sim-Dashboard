import Map from "./Map.jsx";


const MiniMap = () => {

    // SECTION HTML
    return (
        <div className="container-25">
            <div className="list-header">MINI-MAP</div>
            <div className="minimap-container">
                <Map minimap={true}/>
            </div>
        </div>
    );
};
// END SECTION HTML
export default MiniMap;