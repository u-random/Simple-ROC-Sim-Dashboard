// src/views/SettingsPopup.tsx - Simple popup settings menu
// For managing IP addresses of potential simulator servers, and other settings

// TODO: New IP field
// TODO: TAB context
// TODO: Fix styles of buttons, etc
// TODO: Consider some cookies or something for storing settings


import { SettingsPopupProps } from '../types/Types';
import useEscapeKey from "../hooks/useEscapeKey.tsx";
import React from 'react';


const SettingsPopup: React.FC<SettingsPopupProps> = (props: SettingsPopupProps) => {
    const { show, onClose, ipAddresses, setIpAddresses, connectUnity, setConnectUnity } = props;

    if (!show) return null;

    // BEGIN WINDOW HANDLERS
    // Closes popup on ESC key
    useEscapeKey(onClose);

    // Closes popup on outside click
    const handleOverlayClick = (e: React.MouseEvent) => {
        // Close only if the click is on the overlay and not on the content
        if (e.target === e.currentTarget) {onClose();}
    };
    // END WINDOW HANDLERS

    // Function to add a new IP address
    const addIpAddress = () => {
        setIpAddresses([...ipAddresses, '']);
    };

    // Function to remove an IP address
    const removeIpAddress = (index: number) => {
        const newIpAddresses = [...ipAddresses];
        newIpAddresses.splice(index, 1);
        setIpAddresses(newIpAddresses);
    };

    // Function to update an IP address
    const updateIpAddress = (index: number, value: string) => {
        const newIpAddresses = [...ipAddresses];
        newIpAddresses[index] = value;
        setIpAddresses(newIpAddresses);
    };

    // Handle Unity connection toggle
    const handleConnectionToggle = () => {{
        setConnectUnity(!connectUnity);
        console.log("Connection toggle", !connectUnity);
    }
    };

    // TODO: Do some tuning here
    return (
        <div className="settings-popup" onClick={handleOverlayClick}>
            <div className="settings-content">
                <h2>ROC Settings:</h2>
                <button className="exit-button" onClick={onClose}>Close</button>

                <div className="connection-toggle">
                    <h3>Connection Mode:</h3>
                    <div className="toggle-container">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={connectUnity}
                                onChange={handleConnectionToggle}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span className="toggle-label">
                            Unity Connection
                        </span>
                    </div>
                </div>

                <h3>Unity Servers:</h3>
                <div className="ip-list">
                    {ipAddresses.map((ip, index) => (
                        <div key={index} className="ip-item">
                            <input
                                type="text"
                                value={ip}
                                onChange={(e) => updateIpAddress(index, e.target.value)}
                            />
                            <button onClick={() => removeIpAddress(index)}>—</button>
                        </div>
                    ))}
                    <button className="add-ip-button" onClick={addIpAddress}>+</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPopup;