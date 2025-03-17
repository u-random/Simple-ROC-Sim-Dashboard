// src/hooks/useCameraFeed.tsx - Camera hook component


import { useState, useEffect } from 'react';
import { useShips } from './ShipContext';


export function useCameraFeed(shipId: number | null) {
    const { getCameraFrame, subscribeToCameraFrames } = useShips();
    const [frame, setFrame] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        console.log(`useCameraFeed: Hook initialized for ship ${shipId}`);

        if (!shipId) {
            console.log('useCameraFeed: No shipId provided');
            return;
        }

        const initialFrame = getCameraFrame(shipId);
        console.log(`useCameraFeed: Initial frame for ship ${shipId}: ${initialFrame ? 'available' : 'not available'}`);

        const unsubscribe = subscribeToCameraFrames(shipId, (newFrame) => {
            console.log(`useCameraFeed: New frame received for ship ${shipId}, length: ${newFrame.length}`);
            setFrame(newFrame);
            setIsConnected(true);
        });

        return () => {
            console.log(`useCameraFeed: Unsubscribing from ship ${shipId}`);
            unsubscribe();
        };
    }, [shipId, getCameraFrame, subscribeToCameraFrames]);

    return { frame, isConnected };
}