import { useShips } from '../hooks/ShipContext';

const ConningInfo = () => {
    const { ships, selectedShipId } = useShips();
    const ship = ships.find(s => s.id === selectedShipId);

    // Grouping conning data for better organization
    const navigationData = [
        { label: 'Position', value: ship ? `${ship.position.latitude.toFixed(4)}°N, ${ship.position.longitude.toFixed(4)}°E` : 'N/A'},
        { label: 'Speed', value: ship ? `${ship.motion.speed.toFixed(1)} kts` : 'N/A' },
        { label: 'Course', value: ship ? `${ship.motion.course.toFixed(1)}°` : 'N/A' },
        { label: 'Heading', value: ship ? `${ship.motion.heading.toFixed(1)}°` : 'N/A' }
    ];

    /*
    const engineData = [
        { label: 'RPM', value: ship ? `${ship.rpm || 0} rpm` : 'N/A' },
        { label: 'Rudder', value: ship ? `${ship.rudder || 0}°` : 'N/A' },
        { label: 'Thrust', value: ship ? `${(ship.thrust || 0) * 100}%` : 'N/A' }
    ];

    const environmentData = [
        { label: 'Wind Speed', value: ship ? `${ship.windSpeed || 0} kts` : 'N/A' },
        { label: 'Wind Direction', value: ship ? `${ship.windDirection || 0}°` : 'N/A' },
        { label: 'Current Speed', value: ship ? `${ship.currentSpeed || 0} kts` : 'N/A' },
        { label: 'Current Direction', value: ship ? `${ship.currentDirection || 0}°` : 'N/A' }
    ];
    <div className="conning-info">
            {renderDataSection('Navigation', navigationData)}
            {renderDataSection('Engine', engineData)}
            {renderDataSection('Environment', environmentData)}
        </div>

*/
    const renderDataSection = (title, data) => (
        <div className="data-section">
            <div className="section-header">{title}</div>
            {data.map((item, index) => (
                <div key={index} className="list-item">
                    <span className="item-label">{item.label}:</span>
                    <span className="item-value">{item.value}</span>
                </div>
            ))}
        </div>
    );


    return (
        <div className="conning-info">
            {renderDataSection('Navigation', navigationData)}

        </div>
    );
};

export default ConningInfo;