// src/pages/FleetOverview.tsx - View Collection, main page


import Notifications from '../views/Notifications';
import FleetInfo from '../views/FleetInfo';
import Map from '../views/Map';
import React from 'react';


const FleetOverview: React.FC = () => {
    return (
        <div className="internal-container">
            {/* Left Column - Fleet Info */}
            <FleetInfo />

            {/* Center Column - Map */}
            <Map />

            {/* Right Column - Notification center */}
            <Notifications />
        </div>
    );
};

export default FleetOverview;