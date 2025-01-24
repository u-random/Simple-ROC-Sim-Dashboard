//import MapView from './MapLibre';
//import ImageDisplay from './DisplayImage';
//import myImage from '../assets/Debugempty.png';

const FleetOverview = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            margin: 0,
            padding: 0,
            position: 'absolute',
            left: 0,
            top: 0,
            overflow: 'hidden'
        }}>
            {/* Header/Navigation */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '8px',
            }}>
                <button style={{ padding: '8px 16px' }}>Fleet</button>
                <button style={{ padding: '8px 16px', marginLeft: '16px' }}>Ship</button>
            </div>

            {/* Main Content Container */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                flex: 1,
                width: '100%',
                margin: 0,
                padding: 0,
            }}>
                {/* Left Column - Fleet Info */}
                <div style={{
                    width: '25%',
                    backgroundColor: '#663333',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: '20px',
                }}>
                    <h2 style={{ marginBottom: '16px' }}>Fleet INFO</h2>
                    <div>
                        <div style={{ padding: '8px' }}>Ship 1</div>
                        <div style={{ padding: '8px' }}>Ship 2</div>
                        <div style={{ padding: '8px' }}>Ship 3</div>
                    </div>
                </div>

                {/* Center Column - Map */}
                <div style={{
                    width: '50%',
                    backgroundColor: '#335533',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    paddingLeft: '20px',
                }}>
                    <div style={{
                        width: '100%',
                        textAlign: 'left',
                        paddingTop: '20px'
                    }}>
                        OSLOFJORD - 4km x 4km
                        <br />
                        Center: XX° N, XX° E
                    </div>

                    <div style={{
                        width: '100%',
                        textAlign: 'center',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        MAP
                    </div>
                </div>

                {/* Right Column - Alarms */}
                <div style={{
                    width: '25%',
                    backgroundColor: '#333366',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: '20px',
                }}>
                    <h2 style={{ marginBottom: '16px' }}>ALARMS</h2>
                    <div>
                        <div style={{ padding: '8px' }}>Notification 1</div>
                        <div style={{ padding: '8px' }}>Notification 2</div>
                        <div style={{ padding: '8px' }}>Notification 3</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetOverview;