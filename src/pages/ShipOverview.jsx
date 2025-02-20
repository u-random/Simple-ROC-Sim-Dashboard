import WideCamera from '../views/WideCamera';
import Conning from '../views/Conning';
import Radar from '../views/Radar';
import MiniMap from '../views/MiniMap';
import Render3D from '../views/Render3D';

// TODO: Control Mode read input
// TODO: Control Mode ESC for exit shortcut
// TODO: Currently viewing ship label, and drop down list/menu


const ShipOverview = ({ isControlMode, setIsControlMode }) => {
    return (
        <div className="internal-container ship-view">
            {/* Full Width Camera Container */}
            <WideCamera isControlMode={isControlMode} />

            {/* Four Column Layout */}
            <div className="columns-container">
                {/* Conning Info */}
                <Conning
                    isControlMode={isControlMode}
                    setIsControlMode={setIsControlMode}
                />

                {/* Radar View */}
                <Radar />

                {/* Mini Map */}
                <MiniMap />

                {/* 3D Model View */}
                <Render3D />
            </div>
        </div>
    );
};

export default ShipOverview;