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
import { useState, useRef, useEffect }     from 'react';
import './styles/App.css'


function App() {
    const [currentView, setCurrentView] = useState('fleet'); // 'fleet' or 'ship'
    const [isControlMode, setIsControlMode] = useState(false);
    const [isPageTransitioning, setIsPageTransitioning] = useState(false);
    const pageRef = useRef<HTMLDivElement>(null);

    // "Lifting state up" pattern for IP array (Settings popup)
    const [showSettings, setShowSettings] = useState(false);
    const [connectUnity, setConnectUnity] = useState(false);
    const [ipAddresses, setIpAddresses] = useState(['192.168.10.171']); // Can add default ip addresses to this list
    
    // Handle page transition effect
    useEffect(() => {
        // Add active class after initial render to trigger animation
        if (pageRef.current) {
            setIsPageTransitioning(true);
            
            // Use requestAnimationFrame to ensure transition is visible
            requestAnimationFrame(() => {
                if (pageRef.current) {
                    pageRef.current.classList.add('page-transition-enter-active');
                }
            });
            
            // Reset transition state after animation completes
            const timer = setTimeout(() => {
                setIsPageTransitioning(false);
            }, 500); // Match the CSS transition duration
            
            return () => clearTimeout(timer);
        }
    }, [currentView]);

    const settingsPopupProps: SettingsPopupProps = {
        show: showSettings,
        onClose: () => setShowSettings(false),
        ipAddresses,
        setIpAddresses,
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
                            onClick={() => {
                                if (currentView !== 'fleet') {
                                    setCurrentView('fleet');
                                }
                            }}
                            className={currentView === 'fleet' ? 'active' : ''}
                        >
                            Fleet View
                        </button>
                        <button
                            onClick={() => {
                                if (currentView !== 'ship') {
                                    setCurrentView('ship');
                                    setIsControlMode(false);
                                }
                            }}
                            className={currentView === 'ship' ? 'active' : ''}
                        >
                            Ship View
                        </button>
                        {isControlMode && currentView === 'ship' && <div className="control-mode-indicator">CONTROL MODE</div>}

                            <button
                                className="settings-button"
                                onClick={() => setShowSettings(true)}
                            >
                            <SvgCog />
                            </button>

                    </header>

                    <div 
                        key={currentView} 
                        className="page-transition-enter"
                        ref={pageRef}
                    >
                        {currentView === 'fleet' ? (
                            <FleetOverview/>
                        ) : (
                            <ShipOverview
                                isControlMode={isControlMode}
                                setIsControlMode={setIsControlMode}
                            />
                        )}
                    </div>

                    <SettingsPopup {...settingsPopupProps}/>
                </div>
            </MapProvider>
        </ShipProvider>
    );
}

export default App;