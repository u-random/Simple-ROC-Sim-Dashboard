import React from 'react';
import Conning from '../views/Conning';
import Radar from '../views/Radar';
import MiniMap from '../views/MiniMap';
import Render3D from '../views/Render3D';
import CameraView from '../components/CameraView';

import { useShips } from '../components/ShipContext';

interface ShipOverviewProps {
    isControlMode: boolean;
    setIsControlMode: React.Dispatch<React.SetStateAction<boolean>>;
}

// TODO: Control Mode read input
// TODO: Control Mode ESC for exit shortcut
// TODO: Currently viewing ship label, and drop down list/menu
// TODO: Use last selected ship if no active selection
// TODO: Config columns-container to not be 50% of height, but to stretch. Camera container should be fixed height though

const ShipOverview: React.FC<ShipOverviewProps> = ({ isControlMode, setIsControlMode }) => {
    const { selectedShipId, ships } = useShips();
    // Get ship from Ship view.
    const displayedShip = ships.find((ship) => ship.id === selectedShipId);

    return (
        <div className="internal-container ship-view">
            <div className="sub-title">Currently Viewing: {displayedShip?.name || 'N/A'}</div>
            {/* Full Width Camera Container */}
            <CameraView
                shipId={selectedShipId}
                aspectRatio="ultrawide"
                isControlMode={isControlMode}
                isShipView={true}
            />

            {/* Four Column Layout */}
            <div className="columns-container">
                {/* Conning Info */}
                <Conning
                    isControlMode={isControlMode}
                    setIsControlMode={setIsControlMode}
                />

                {/* Radar View */}
                <Radar/>

                {/* Mini Map */}
                <MiniMap/>

                {/* 3D Model View */}
                <Render3D/>
            </div>
        </div>
    );
};

export default ShipOverview;