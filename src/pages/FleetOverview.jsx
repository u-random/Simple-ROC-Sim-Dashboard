import FleetInfo from '../views/FleetInfo';
import Map from '../views/Map';
import Notifications from '../views/Notifications';


const FleetOverview = () => {
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