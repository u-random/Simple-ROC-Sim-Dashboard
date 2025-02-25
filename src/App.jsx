import { useState } from 'react';
import './styles/App.css'
import FleetOverview from './pages/FleetOverview';
import ShipOverview from './pages/ShipOverview';
import { ShipProvider } from './components/ShipContext';
import { MapProvider } from './components/MapContext';

// This is the main window/collection of views
// TODO: OK - Add toggle between views
// TODO: Disallow view switch when in control mode
// TODO: In regard to the above, have an alert to say "Going to Fleet Overview will exit Control Mode. Are you sure?"
// TODO: In Fleet View button, add code to turn isControlMode off.

// TODO: 25 feb: Set up a connection to ship id here, to pass on to fleetoverview and shipoverview, to use in camera/notification/Fleetinfo etc


function App() {
    const [currentView, setCurrentView] = useState('fleet'); // 'fleet' or 'ship'
    const [isControlMode, setIsControlMode] = useState(false);


    return (
        <ShipProvider>
            <MapProvider>
                <div className="app-container">
                    <header className="header">
                        <div className="title">Remote Operation Center</div>
                        <button
                            onClick={() => setCurrentView('fleet')}
                            className={currentView === 'fleet' ? 'active' : ''}
                        >
                            Fleet View
                        </button>
                        <button
                            onClick={() => setCurrentView('ship')}
                            className={currentView === 'ship' ? 'active' : ''}
                        >
                            Ship View
                        </button>
                        {isControlMode && <div className="control-mode-indicator">CONTROL MODE</div>}
                    </header>

                    {currentView === 'fleet' ? (
                        <FleetOverview />
                    ) : (
                        <ShipOverview
                            isControlMode={isControlMode}
                            setIsControlMode={setIsControlMode}
                        />
                    )}
                </div>
            </MapProvider>
        </ShipProvider>
    );
}

export default App;