import './styles/App.css'
import { useState } from 'react';
import FleetOverview from './pages/FleetOverview';
import ShipOverview from './pages/ShipOverview';
import { MapProvider } from './components/MapContext';
import { ShipProvider } from './components/ShipContext.tsx';

import { WebSocketService, WebSocketMessage } from './services/WebSocketService';
import createWebSocketServer from './server/WebSocketServer';

// This is the main window/collection of views
// TODO: OK - Add toggle between views
// TODO: Disallow view switch when in control mode
// TODO: In regard to the above, have an alert to say "Going to Fleet Overview will exit Control Mode. Are you sure?"
// TODO: In Fleet View button, add code to turn isControlMode off.

// TODO: 25 feb: Set up a connection to ship id here, to pass on to fleetoverview and shipoverview, to use in camera/notification/Fleetinfo etc


function App() {
    const [currentView, setCurrentView] = useState('fleet'); // 'fleet' or 'ship'
    const [isControlMode, setIsControlMode] = useState(false);

    // BEGIN SERVER SETUP
    const [wsService] = useState(() => new WebSocketService());
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<WebSocketMessage[]>([]);
    const [serverRunning, setServerRunning] = useState(false);

    // Start the WebSocket server when the application loads
    useEffect(() => {
        // Only create the server if it's not already running
        if (!serverRunning) {
            console.log('Starting WebSocket server...');

            // In a real app, might want to check if the server is already running
            const server = createWebSocketServer(3000);
            setServerRunning(true);

            // Clean up the server on component unmount
            return () => {
                console.log('Shutting down WebSocket server...');
                server.close();
                setServerRunning(false);
            };
        }
    }, [serverRunning]);

    // Connect to the WebSocket server as a client
    useEffect(() => {
        wsService.on('connected', () => {
            setConnected(true);
            console.log('Connected to WebSocket server');
        });

        wsService.on('disconnected', () => {
            setConnected(false);
            console.log('Disconnected from WebSocket server');
        });

        wsService.on('message', (message: WebSocketMessage) => {
            console.log('Received message:', message);
            setMessages(prev => [...prev, message]);
        });

        // Connect to the server
        wsService.connect();

        // Clean up event listeners on unmount
        return () => {
            wsService.removeAllListeners();
            wsService.disconnect();
        };
    }, [wsService]);

    // END SERVER SETUP


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