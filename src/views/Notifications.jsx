const Notifications = () => {
    const notifications = ['Maneuvering','Docking','Loading'];

    const handleClick = (notification) => {
        console.log(`Selected ${notification}`);
        // Add click handler logic here
    };

    return (
        <div className="container-25">
            <div className="list-header">
                NOTIFICATIONS
            </div>
            <div className="list">
                {notifications.map((notification) => (
                    <button
                        key={notification}
                        className="list-item"
                        onClick={() => handleClick(notification)}
                    >
                        {notification}
                    </button>
                ))}
            </div>
        </div>
    );
};
export default Notifications;