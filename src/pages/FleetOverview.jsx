import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Video, Map, GitCommit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/card';
import { Alert, AlertDescription } from '../components/alert';


// Mock WebSocket connection - replace with actual implementation
const RemoteInterface = () => {
    const [connected] = useState(false);
    const [vessels, setVessels] = useState([]);
    const mapCanvasRef = useRef(null);
    const [mapImage, setMapImage] = useState(null);

    // Setup canvas and load map
    useEffect(() => {
        const canvas = mapCanvasRef.current;
        const ctx = canvas.getContext('2d');

        // Load and draw map image
        const img = new Image();
        img.src = '/api/placeholder/800/600';  // Replace with actual map image
        img.onload = () => {
            setMapImage(img);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
    }, []);

    // Draw vessels on map
    useEffect(() => {
        if (!mapImage || !mapCanvasRef.current) return;

        const canvas = mapCanvasRef.current;
        const ctx = canvas.getContext('2d');

        // Clear and redraw base map
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

        // Draw vessels
        vessels.forEach(vessel => {
            ctx.beginPath();
            ctx.fillStyle = 'red';
            // Convert vessel coordinates to canvas coordinates
            const x = (vessel.x / 100) * canvas.width;
            const y = (vessel.y / 100) * canvas.height;

            // Draw arrow
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(vessel.heading * Math.PI / 180);
            ctx.moveTo(-10, -5);
            ctx.lineTo(10, 0);
            ctx.lineTo(-10, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    }, [vessels, mapImage]);

    // Mock receiving vessel updates
    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate receiving vessel positions
            setVessels([
                { id: 1, x: Math.random() * 100, y: Math.random() * 100, heading: Math.random() * 360 },
                { id: 2, x: Math.random() * 100, y: Math.random() * 100, heading: Math.random() * 360 }
            ]);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-screen p-4 bg-gray-100">
            {/* Connection Status */}
            {!connected && (
                <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <p>  Not connected to simulator. Attempting to reconnect...</p>
                        Hello there!
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-3 gap-4 flex-grow">
                {/* Map View */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Map className="h-4 w-4" />
                            Vessel Map
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <canvas
                            ref={mapCanvasRef}
                            width={800}
                            height={600}
                            className="w-full h-full border rounded"
                        />
                    </CardContent>
                </Card>

                {/* Camera Feed */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Camera Feed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-video bg-gray-900 rounded flex items-center justify-center">
                            <p className="text-gray-400">Waiting for video stream...</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Vessel Data */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GitCommit className="h-4 w-4" />
                            Vessel Telemetry
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                            {vessels.map(vessel => (
                                <div key={vessel.id} className="p-4 bg-gray-50 rounded">
                                    <h3 className="font-medium">Vessel {vessel.id}</h3>
                                    <p>Position: ({vessel.x.toFixed(1)}, {vessel.y.toFixed(1)})</p>
                                    <p>Heading: {vessel.heading.toFixed(1)}°</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RemoteInterface;