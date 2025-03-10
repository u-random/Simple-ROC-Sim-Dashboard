// StaticShips.ts
import { ShipData, ShipStatus } from '../types/Types';

// Map center for positioning static ships
const MAP_CENTER = [10.570455, 59.425565];

export const staticShips: ShipData[] = [
    {
        id: 101,
        name: "Harbor Camera",
        position: { longitude: MAP_CENTER[0], latitude: MAP_CENTER[1] },
        motion: { heading: 0, speed: 0, course: 0 },
        status: ShipStatus.DOCKED,
        connection: { connected: true, lastUpdated: Date.now() },
        telemetry: {},
        cameraFeed: "../assets/harbor_camera.jpg"
    },
    {
        id: 102,
        name: "Bridge Camera",
        position: { longitude: MAP_CENTER[0] + 0.01, latitude: MAP_CENTER[1] - 0.005 },
        motion: { heading: 270, speed: 0, course: 0 },
        status: ShipStatus.DOCKED,
        connection: { connected: true, lastUpdated: Date.now() },
        telemetry: {},
        cameraFeed: "../assets/bridge_camera.jpg"
    }
];