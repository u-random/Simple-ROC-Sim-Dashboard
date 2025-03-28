// src/hooks/useCameraFeed.tsx - Camera hook component


import { useState, useEffect, useRef } from 'react';
import { useShips } from './ShipContext';


export function useCameraFeed(shipId: number | null) {
    const { getCameraFrame, subscribeToCameraFrames } = useShips();
    const [frame, setFrame] = useState<string | Blob | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [frameObjectUrl, setFrameObjectUrl] = useState<string | null>(null);
    const previousShipIdRef = useRef<number | null>(null);

    // Clean up any previous object URLs when component unmounts
    useEffect(() => {
        return () => {
            if (frameObjectUrl) {
                URL.revokeObjectURL(frameObjectUrl);
            }
        };
    }, []);

    useEffect(() => {
        console.log(`useCameraFeed: Ship ID changed from ${previousShipIdRef.current} to ${shipId}`);
        
        // Only reset state when shipId actually changes
        if (previousShipIdRef.current !== shipId) {
            console.log(`useCameraFeed: Resetting state due to ship ID change`);
            
            // Clean up any previous object URLs
            if (frameObjectUrl) {
                URL.revokeObjectURL(frameObjectUrl);
                setFrameObjectUrl(null);
            }
            
            // Reset state when switching ships
            setFrame(null);
            setIsConnected(false);
            
            // Update the previous shipId reference
            previousShipIdRef.current = shipId;
        }

        // If no shipId, just return early - nothing to subscribe to
        if (!shipId) {
            console.log('useCameraFeed: No shipId provided');
            return;
        }

        const initialFrame = getCameraFrame(shipId);
        console.log(`useCameraFeed: Initial frame for ship ${shipId}: ${initialFrame ? 'available' : 'not available'}`);

        // Create a stable callback reference to prevent constant resubscribing
        const handleNewFrame = (newFrame: string | Blob) => {
            console.log(`useCameraFeed: New frame received for ship ${shipId}, type: ${typeof newFrame}`);
            
            // If the frame is a Blob, create an object URL
            if (newFrame instanceof Blob) {
                // Clean up previous object URL
                if (frameObjectUrl) {
                    URL.revokeObjectURL(frameObjectUrl);
                }
                
                // Create new object URL for the blob
                const url = URL.createObjectURL(newFrame);
                setFrameObjectUrl(url);
                
                // For backward compatibility, we store the frame as-is
                setFrame(newFrame);
            } else {
                // For base64 strings, just set the frame directly
                setFrame(newFrame);
                setFrameObjectUrl(null);
            }
            
            setIsConnected(true);
        };

        // Subscribe to camera frames for this shipId
        const unsubscribe = subscribeToCameraFrames(shipId, handleNewFrame);

        // Cleanup on unmount or when shipId changes
        return () => {
            console.log(`useCameraFeed: Cleaning up subscription for ship ${shipId}`);
            unsubscribe();
        };
    // Only re-run when shipId changes
    }, [shipId, getCameraFrame, subscribeToCameraFrames]);

    return { frame, isConnected, frameObjectUrl };
}