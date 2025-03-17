// src/views/Notifications.tsx
// This is the file for the right column view of the Fleet Overview page
// Has two variations: A notification list and then more ship specific stuff
// Has an uncover type animation between variations, symmetric to FleetInfo

// TODO: Crop camera view


import { useShips } from '../hooks/ShipContext';
import CameraView from '../views/CameraView';
import { useState, useEffect } from 'react';
//import { ShipStatus } from '../types/Types';

// Define notification type
interface Notification {
    id          : number;
    type        : 'alert' | 'info' | 'warning' | 'status';
    message     : string;
    timestamp   : string;
}

// Define notifications by ship ID map
// TODO: Get notifications from Unity (incorporate in Ship interface)
interface ShipNotifications {
    [key: number]: Notification[];
}

const Notifications = () => {
    const { selectedShipId, ships } = useShips();
    const [displayedShipId, setDisplayedShipId] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Update displayed content with delay - exactly like FleetInfo
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
            }, 600); // Match the CSS animation duration
            return () => clearTimeout(timer);
        }
    }, [isAnimating]);




// Hard coded notifications
    // TODO: move out of here
    // Mock data structure
    const generalNotifications: Notification[] = [
        { id: 1, type: 'alert', message: 'Maneuvering', timestamp: '10:00' },
        { id: 2, type: 'info', message: 'Docking', timestamp: '10:30' },
        { id: 3, type: 'warning', message: 'Loading', timestamp: '11:00' }
    ];

    // Use proper ship IDs that match your ShipContext
    const shipNotifications: ShipNotifications = {
        101: [
            { id: 1, type: 'status', message: 'In transit', timestamp: '10:00' },
            { id: 2, type: 'status', message: 'Docked', timestamp: '10:00' },
            { id: 3, type: 'status', message: 'Loading', timestamp: '07:00' }
        ],
        102: [
            { id: 1, type: 'alert', message: 'Speed warning', timestamp: '09:30' },
            { id: 2, type: 'info', message: 'Approaching dock', timestamp: '09:45' }
        ],
        1000: [
            { id: 1, type: 'alert', message: 'Approaching shallow water', timestamp: '10:15' },
            { id: 2, type: 'warning', message: 'Speed warning', timestamp: '10:20' }
        ],
        1001: [
            { id: 1, type: 'info', message: 'Course adjusted', timestamp: '09:55' },
            { id: 2, type: 'status', message: 'On schedule', timestamp: '10:00' }
        ]
    };

    // Safely get notifications for the displayed ship (using displayedShipId instead of selectedShipId)
    const currentShipNotifications =
        displayedShipId !== null && shipNotifications[displayedShipId]
            ? shipNotifications[displayedShipId]
            : [];

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
                        {/* Camera View */}
                        <CameraView
                            shipId={displayedShipId}
                            aspectRatio="standard"
                        />

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
                      No actions for this ship
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

export default Notifications;