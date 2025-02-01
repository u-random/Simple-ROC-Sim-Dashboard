const FleetInfo = () => {
    const ships = ['Ship 1', 'Ship 2', 'Ship 3', 'Ship 4', 'Ship 5', 'Ship 6', 'Ship 7', 'Ship 8', 'Ship 9'];

    const handleShipClick = (shipName) => {
        console.log(`Selected ${shipName}`);
        // Add click handler logic here
    };

    return (
        <div className="container-25">
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
    );
};

export default FleetInfo;