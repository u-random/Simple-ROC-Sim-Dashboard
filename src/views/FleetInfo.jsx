// This is the file for the left column view of the Fleet Overview page
// Has two variations: A list of ships and then ship specific info if a ship is selected
// Has an uncover type animation between variations

import { useState, useEffect } from 'react';
import { useShips } from '../components/ShipContext';

// TODO: Fix back button overlap when small width
// TODO: OK - Change content for Ship Info
// TODO: OK - Ship Info: Ship name reset too soon.
// TODO: Potential for backside: Create gauges and animated things to represent conning


const FleetInfo = () => {
    const { ships, selectedShipId, selectShip } = useShips();
    const [displayedShipId, setDisplayedShipId] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

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
            }, 600); // Match the CSS animation duration
            return () => clearTimeout(timer);
        }
    }, [isAnimating]);

    // Get ship from Ship view.
    const displayedShip = ships.find(ship => ship.id === displayedShipId);
    const animationStyle = 'uncover';

    return (
        <div className="container-25">
            <div className="content-wrapper">
                <div className={`container-animation ${animationStyle} ${selectedShipId ? 'show-back' : ''}`}>
                    {/* Front face - Ship List */}
                    <div className="face front">
                        <div className="list-header">
                            FLEET INFO
                        </div>
                        <div className="list">
                            {ships.map(ship => (
                                <button
                                    key={ship.id}
                                    className="list-item"
                                    onClick={() => selectShip(ship.id)}
                                >
                                    {ship.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Back face - Ship Details */}
                    <div className="face back">
                        <div className="list-header">
                            <button
                                className="back-button"
                                onClick={() => selectShip(null)}
                            >
                                Back
                            </button>
                            {displayedShip?.name || 'N/A'}
                        </div>

                        <div className="list">
                            <div className="list-item">
                                Position: {displayedShip?.position || 'N/A'}
                            </div>
                            <div className="list-item">
                                Speed: {displayedShip ? `${displayedShip.motion.speed.toFixed(1)} knots` : 'N/A'}
                            </div>
                            <div className="list-item">
                                Course: {displayedShip ? `${displayedShip.motion.course.toFixed(1)}°` : 'N/A'}
                            </div>
                            <div className="list-item">
                                Heading: {displayedShip ? `${displayedShip.motion.heading.toFixed(1)}°` : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetInfo;
