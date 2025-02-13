import { useShips } from '../components/ShipContext';
import CameraView from '../components/CameraView';
import { useState, useEffect } from 'react';

const Notifications = () => {
    const { selectedShipId, ships } = useShips();
    const [displayedShipId, setDisplayedShipId] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);


    // SECTION Animation Delay
    // Update displayed content with delay
    useEffect(() => {
        if (selectedShipId) {
            // When selecting a ship, update immediately
            setDisplayedShipId(selectedShipId);
            setIsAnimating(true);
        } else {
            // When deselecting, wait for animation
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setDisplayedShipId(null);
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [selectedShipId]);

    // Reset animation flag after transition
    useEffect(() => {
        if (isAnimating) {
            const timer = setTimeout(() => {
                setIsAnimating(false);
            }, 600); // Match your CSS animation duration
            return () => clearTimeout(timer);
        }
    }, [isAnimating]);
    // END SECTION Animation Delay


    // SECTION Mock Data
    // Mock data structure
    const generalNotifications = [
        { id: 1, type: 'alert', message: 'Maneuvering', timestamp: '10:00' },
        { id: 2, type: 'info', message: 'Docking', timestamp: '10:30' },
        { id: 3, type: 'warning', message: 'Loading', timestamp: '11:00' }
    ];

    const shipNotifications = {
        1: [
            { id: 1, type: 'status', message: 'In transit', timestamp: '10:00' },
            { id: 2, type: 'status', message: 'Docked', timestamp: '10:00' },
            { id: 3, type: 'status', message: 'Loading', timestamp: '07:00' }
        ],
        2: [
            { id: 1, type: 'alert', message: 'Speed warning', timestamp: '09:30' },
            { id: 2, type: 'info', message: 'Approaching dock', timestamp: '09:45' }
        ]
    };

    const currentShipNotifications = displayedShipId && shipNotifications[displayedShipId]
        ? shipNotifications[displayedShipId]
        : [];
    // END SECTION Mock Data


    // SECTION HTML
    return (
        <div className="container-25 notifications-container">
            <div className="content-wrapper">
                <div className={`container-animation uncover ${selectedShipId ? 'show-back' : ''}`}>
                    {/* Front face - General Notifications */}
                    <div className="face front">
                        <div className="list-header">
                            NOTIFICATIONS
                        </div>
                        <div className="list">
                            {generalNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`list-item notification-${notification.type}`}
                                >
                                    <div className="notification-content">
                                        <span className="notification-message">
                                            {notification.message}
                                        </span>
                                        <span className="notification-time">
                                            {notification.timestamp}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Back face - Ship Specific View */}
                    <div className="face back">
                        {/* Camera View - Note the +1 for vessel number */}
                        {displayedShipId &&
                            <CameraView
                                shipId={displayedShipId}
                            />
                        }

                        {/* Ship Notifications */}
                        <div className="list-header">
                            Actions
                        </div>
                        <div className="list">
                            {currentShipNotifications.length > 0 ? (
                                currentShipNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`list-item notification-${notification.type}`}
                                    >
                                        <div className="notification-content">
                                            <span className="notification-message">
                                                {notification.message}
                                            </span>
                                            <span className="notification-time">
                                                {notification.timestamp}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="list-item">
                                    <div className="notification-content">
                                        <span className="notification-message">
                                            No actions from this ship
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// END SECTION HTML
export default Notifications;