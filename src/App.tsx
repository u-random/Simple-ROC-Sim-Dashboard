// src/App.tsx - This is the main window container
// Wraps context providers as well

// TODO: ? Disallow view switch when in control mode
// In regard to the above, have an alert to say "Going to Fleet Overview will exit Control Mode. Are you sure?"
// TODO: Improve settings menu in header
// TODO: Fix header buttons to be similar width/height, if not currently
// TODO: Fix ship remaining in context even after connection loss: Should disappear


import { SettingsPopupProps }   from './types/Types';
import { ShipProvider } from './hooks/ShipContext.tsx';
import SettingsPopup    from './views/SettingsPopup';
import FleetOverview    from './pages/FleetOverview';
import ShipOverview     from './pages/ShipOverview';
import SvgCog           from './components/SvgCog';
import { MapProvider }  from './hooks/MapContext';
import { useState }     from 'react';
import './styles/App.css'


function App() {
    const [currentView, setCurrentView] = useState('fleet'); // 'fleet' or 'ship'
    const [isControlMode, setIsControlMode] = useState(false);

    // "Lifting state up" pattern for IP array (Settings popup)
    const [showSettings, setShowSettings] = useState(false);
    const [connectUnity, setConnectUnity] = useState(false);
    const [ipAddresses, setIpAddresses] = useState([
        '192.168.10.127'
    ]);
    const [selectedIp, setSelectedIp] = useState('192.168.10.100'); // TODO: remove


    const settingsPopupProps: SettingsPopupProps = {
        show: showSettings,
        onClose: () => setShowSettings(false),
        ipAddresses,
        setIpAddresses,
        selectedIp,
        setSelectedIp,
        connectUnity,
        setConnectUnity
    };


    return (
        <ShipProvider ipAddresses={ipAddresses} connectUnity={connectUnity}>
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
                            onClick={() => {setCurrentView('ship'); setIsControlMode(false);}}
                            className={currentView === 'ship' ? 'active' : ''}
                        >
                            Ship View
                        </button>
                        {isControlMode && currentView === 'ship' && <div className="control-mode-indicator">CONTROL MODE</div>}
                        {currentView === 'fleet' &&
                            <button
                                className="settings-button"
                                onClick={() => setShowSettings(true)}
                            >
                            <SvgCog />
                            </button>
                        }
                    </header>

                    {currentView === 'fleet' ? (
                        <FleetOverview/>
                    ) : (
                        <ShipOverview
                            isControlMode={isControlMode}
                            setIsControlMode={setIsControlMode}
                        />
                    )}

                    <SettingsPopup {...settingsPopupProps}/>
                </div>
            </MapProvider>
        </ShipProvider>
    );
}

export default App;