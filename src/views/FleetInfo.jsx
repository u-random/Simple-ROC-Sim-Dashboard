import { useState } from 'react';

const FleetInfo = () => {
    const [selectedShip, setSelectedShip] = useState(null);
    const ships = ['Ship 1', 'Ship 2', 'Ship 3', 'Ship 4', 'Ship 5', 'Ship 6', 'Ship 7', 'Ship 8', 'Ship 9'];

    const handleShipClick = (shipName) => {
        setSelectedShip(shipName);
    };

    const handleBackClick = () => {
        setSelectedShip(null);
    };

    return (
        <div className="container-25">
            {/* 3D container for the animation. */}
            {/* If both expressions true, string is: cube-container show-back */}
            <div className={`container-3d ${selectedShip ? 'show-back' : ''}`}>
                {/* Front face - Fleet Info */}
                <div className="face-3d face-front">
                    <div className="list-header">
                        FLEET INFO
                    </div>
                    <div className="list">
                        {ships.map((ship) => (
                            <button
                                key={ship}
                                className="list-item"
                                onClick={() => handleShipClick(ship)}
                            >
                                {ship}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Back face - Ship Info */}
                <div className="face-3d face-back">
                    <div className="list-header">
                        <button
                            onClick={handleBackClick}
                            className="back-button"
                        >
                            ← Back
                        </button>
                        <span>{selectedShip}</span>
                    </div>
                    <div className="list">
                        <div className="list-item">Position</div>
                        <div className="list-item">Speed</div>
                        <div className="list-item">Course</div>
                        <div className="list-item">Heading</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetInfo;