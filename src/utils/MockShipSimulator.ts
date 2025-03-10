// This is a simple Typescript simulator to create mock ships
// for testing purposes. Data structure mirrors that of Unity

import { ShipData, ShipStatus } from '../types/Types';

export interface MockShipConfig {
  shipCount: number;
  updateInterval: number; // in milliseconds
  mapCenter: [number, number]; // [longitude, latitude]
  mapSizeKm: number;
  speedRange: [number, number]; // [min, max] in knots
}

interface SimulatorContext {
  ships: ShipData[];
  setShips: (ships: ShipData[] | ((prevShips: ShipData[]) => ShipData[])) => void;
  config: Partial<MockShipConfig>;
}


export default class MockShipSimulator {
  private ships: ShipData[] = [];
  private interval: NodeJS.Timeout | null = null;
  private shipContext: SimulatorContext;
  private config: MockShipConfig;
  private running: boolean = false;
  private latOffset: number;
  private lonOffset: number;
  private kmPerDegreeLat: number = 111;
  private kmPerDegreeLon: number;

  constructor(shipContext: any, config?: Partial<MockShipConfig>) {
    this.shipContext = shipContext;

    // Default configuration
    this.config = {
      shipCount: 5,
      updateInterval: 1000,
      mapCenter: [10.570455, 59.425565],
      mapSizeKm: 10,
      speedRange: [5, 20],
      ...config
    };

    // Calculate offsets
    this.kmPerDegreeLon = this.kmPerDegreeLat *
        Math.cos(this.config.mapCenter[1] * Math.PI / 180);
    this.latOffset = this.config.mapSizeKm / (2 * this.kmPerDegreeLat);
    this.lonOffset = this.config.mapSizeKm / (2 * this.kmPerDegreeLon);
  }

  public start(): void {
    if (this.running) return;

    // Generate initial ships
    this.generateShips();

    // Add ships to context
    this.updateShipsInContext();

    // Start update interval
    this.interval = setInterval(() => {
      this.updateShipPositions();
      this.updateShipsInContext();
    }, this.config.updateInterval);

    this.running = true;
  }

  public stop(): void {
    if (!this.running) return;

    // Clear interval
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Remove mock ships from context
    this.removeShipsFromContext();

    this.running = false;
  }

  public isRunning(): boolean {
    return this.running;
  }

  private generateShips(): void {
    const { shipCount, mapCenter, speedRange } = this.config;

    this.ships = Array.from({ length: shipCount }, (_, i) => ({
      id: 1000 + i, // Starting IDs from 1000 to avoid conflicts
      name: `Mock Vessel ${i + 1}`,
      position: {
        longitude: mapCenter[0] + (Math.random() * 2 - 1) * this.lonOffset * 0.8,
        latitude: mapCenter[1] + (Math.random() * 2 - 1) * this.latOffset * 0.8,
      },
      motion: {
        heading: Math.random() * 360,
        speed: speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]),
        course: Math.random() * 360,
      },
      status: ShipStatus.ACTIVE,
      connection: {
        connected: true,
        lastUpdated: Date.now(),
        signalStrength: 0.8 + Math.random() * 0.2
      },
      telemetry: {
        rpm: 1000 + Math.random() * 500,
        fuelLevel: 70 + Math.random() * 30
      }
    }));
  }

  private updateShipPositions(): void {
    const { mapCenter } = this.config;

    this.ships = this.ships.map(ship => {
      // Convert speed from knots to degrees per second
      const speedLonPerSec = ship.motion.speed / (this.kmPerDegreeLon * 3600);
      const speedLatPerSec = ship.motion.speed / (this.kmPerDegreeLat * 3600);

      // Calculate new position
      const headingRad = ship.motion.heading * Math.PI / 180;
      const newLong = ship.position.longitude +
          Math.sin(headingRad) * speedLonPerSec * this.config.updateInterval / 1000;
      const newLat = ship.position.latitude +
          Math.cos(headingRad) * speedLatPerSec * this.config.updateInterval / 1000;

      // Bounds checking
      const boundedLong = Math.max(mapCenter[0] - this.lonOffset,
          Math.min(mapCenter[0] + this.lonOffset, newLong));
      const boundedLat = Math.max(mapCenter[1] - this.latOffset,
          Math.min(mapCenter[1] + this.latOffset, newLat));

      // Add some small random variations
      const newHeading = (ship.motion.heading + (Math.random() * 2 - 1) * 0.5) % 360;
      const newSpeed = Math.max(
          this.config.speedRange[0],
          Math.min(
              this.config.speedRange[1],
              ship.motion.speed + (Math.random() * 2 - 1) * 0.2
          )
      );

      return {
        ...ship,
        position: {
          longitude: boundedLong,
          latitude: boundedLat
        },
        motion: {
          heading: newHeading,
          speed: newSpeed,
          course: newHeading // Simplified: course follows heading
        },
        connection: {
          ...ship.connection,
          lastUpdated: Date.now(),
          signalStrength: Math.min(1, Math.max(0.7, (ship.connection.signalStrength || 0.8) + (Math.random() * 0.1 - 0.05)))
        }
      };
    });
  }

  private updateShipsInContext(): void {
    // Get current ships from context
    const { ships = [], setShips } = this.shipContext;

    // Filter out existing mock ships
    const nonMockShips = ships.filter((ship: ShipData) =>
        !this.ships.some(mockShip => mockShip.id === ship.id)
    );

    // Add updated mock ships
    setShips([...nonMockShips, ...this.ships]);
  }

  private removeShipsFromContext(): void {
    const { ships = [], setShips } = this.shipContext;

    // Filter out mock ships
    const nonMockShips = ships.filter((ship: ShipData) =>
        !this.ships.some(mockShip => mockShip.id === ship.id)
    );

    setShips(nonMockShips);
  }
}