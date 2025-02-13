import './styles/App.css'
import FleetOverview from './pages/FleetOverview';
import { ShipProvider } from './components/ShipContext';

// This is the main window/collection of views
// TODO: Add toggle between views


function App() {
    return (
        <ShipProvider>
            <div className="app-container">
                <FleetOverview />
            </div>
        </ShipProvider>
    );
}

export default App;