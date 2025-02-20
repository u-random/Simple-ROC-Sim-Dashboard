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