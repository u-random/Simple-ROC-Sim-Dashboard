// MapConstants.ts - This file contains the constants used in map related implementations


// Type definition
export interface MapConstantsType {
    MAP_CENTER: number[];
    MAP_SIZE_KM: number;
    KM_PER_DEGREE_LAT: number;
    KM_PER_DEGREE_LON: number;
    LAT_OFFSET: number;
    LON_OFFSET: number;
    MIN_ZOOM: number;
    MAX_ZOOM: number;
    INITIAL_ZOOM: number;
    MAX_BOUNDS: number[][];
}

// Base values
const MAP_CENTER: number[] = [10.570455, 59.425565];
const MAP_SIZE_KM: number  = 12;
const KM_PER_DEGREE_LAT: number = 111.1;

// Calculations
const KM_PER_DEGREE_LON = KM_PER_DEGREE_LAT * Math.cos(MAP_CENTER[1] * Math.PI / 180);
const LAT_OFFSET = MAP_SIZE_KM / (2 * KM_PER_DEGREE_LAT);
const LON_OFFSET = MAP_SIZE_KM / (2 * KM_PER_DEGREE_LON);
const INITIAL_ZOOM = 9;
const MAX_ZOOM = 16;
const MIN_ZOOM = 9;
const MAX_BOUNDS = [
    [MAP_CENTER[0] - LON_OFFSET, MAP_CENTER[1] - LAT_OFFSET],
    [MAP_CENTER[0] + LON_OFFSET, MAP_CENTER[1] + LAT_OFFSET]
];

// Export populated interface
export const MapConstants: MapConstantsType = {
    MAP_CENTER,
    MAP_SIZE_KM,
    KM_PER_DEGREE_LAT,
    KM_PER_DEGREE_LON,
    LAT_OFFSET,
    LON_OFFSET,
    MIN_ZOOM,
    MAX_ZOOM,
    INITIAL_ZOOM,
    MAX_BOUNDS
};

// Export individual constants
export {
    MAP_CENTER,
    MAP_SIZE_KM,
    KM_PER_DEGREE_LAT,
    KM_PER_DEGREE_LON,
    LAT_OFFSET,
    LON_OFFSET,
    MIN_ZOOM,
    MAX_ZOOM,
    INITIAL_ZOOM,
    MAX_BOUNDS
};