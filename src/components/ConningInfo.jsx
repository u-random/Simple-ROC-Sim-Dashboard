import React from 'react';
import { useShips } from './ShipContext.jsx';

const ConningInfo = () => {
    const { ships, selectedShipId } = useShips();
    const ship = ships.find(s => s.id === selectedShipId);

    // Grouping conning data for better organization
    const navigationData = [
        { label: 'Position', value: ship?.position || 'N/A' },
        { label: 'Speed', value: ship ? `${ship.speed.toFixed(1)} kts` : 'N/A' },
        { label: 'Course', value: ship ? `${ship.course.toFixed(1)}°` : 'N/A' },
        { label: 'Heading', value: ship ? `${ship.heading.toFixed(1)}°` : 'N/A' }
    ];

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
            {renderDataSection('Engine', engineData)}
            {renderDataSection('Environment', environmentData)}
        </div>
    );
};

export default ConningInfo;