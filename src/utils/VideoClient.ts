// src/utils/VideoClient.ts


import {BaseSocketClient, ConnectionState} from './BaseSocketClient';


export class VideoClient extends BaseSocketClient {
    private onCameraFrameReceived: ((shipId: number, frameData: string | Blob) => void) | null = null;
    private activeShipId: number | null = null;

    constructor(
        serverIp: string,
        port: number = 3001,
        onCameraFrameReceived?: (shipId: number, frameData: string | Blob) => void,
        onConnectionStateChanged?: (state: ConnectionState) => void
    ) {
        super(serverIp, port, onConnectionStateChanged);
        this.onCameraFrameReceived = onCameraFrameReceived || null;
    }
    
    /**
     * Request camera feed from a specific ship
     * @param shipId The ID of the ship to request camera feed from
     * @param enable True to enable camera feed, false to disable
     * @returns True if request was sent successfully
     */
    public requestCameraFeed(shipId: number, enable: boolean = true): boolean {
        console.log(`VideoClient: Requesting camera feed for ship ${shipId}, enable=${enable}`);
        
        // If we're enabling a camera, store the active ship ID
        if (enable) {
            this.activeShipId = shipId;
        } else if (this.activeShipId === shipId) {
            // If we're disabling the active camera, clear the active ship ID
            this.activeShipId = null;
        }
        
        return this.sendMessage({
            type: 'camera_request',
            shipID: shipId.toString(),
            enable: enable
        });
    }
    
    /**
     * Get the currently active ship ID for camera feed
     * @returns The currently active ship ID, or null if no ship is active
     */
    public getActiveShipId(): number | null {
        return this.activeShipId;
    }

    protected handleConnected(): void {
        // Register as ROC client for video
        const success = this.sendMessage({
            type: 'register',
            role: 'roc',
            clientId: `roc-video-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        });
        
        console.log(`VideoClient: Registration message sent, success=${success}`);
        
        // Re-request camera feed for the active ship if there is one
        if (this.activeShipId !== null) {
            console.log(`VideoClient: Re-requesting camera feed for active ship ${this.activeShipId}`);
            this.requestCameraFeed(this.activeShipId, true);
        }
        
        // Set a timer to verify we're receiving frames
        setTimeout(() => {
            // If we haven't received any frames in 5 seconds after connecting, try reconnecting
            if (this.lastFrameReceived === 0 && this.socket && this.connectionState === ConnectionState.Connected) {
                console.warn("VideoClient: No frames received after connection, reconnecting...");
                this.reconnect();
            }
        }, 5000);
    }
    
    // Track when we last received a frame
    private lastFrameReceived: number = 0;

    protected handleDisconnected(): void {
        console.log("VideoClient: Disconnected, resetting last frame received timestamp");
        // Reset the last frame received timestamp when disconnected
        this.lastFrameReceived = 0;
    }

    protected processSpecificMessage(message: any): void {
        // Check if message or message.type is undefined
        if (!message || typeof message !== 'object') {
            console.warn(`VideoClient: Received invalid message: ${JSON.stringify(message)}`);
            return;
        }

        if (message.type === undefined) {
            console.warn(`VideoClient: Received message with undefined type: ${JSON.stringify(message)}`);
            return;
        }
        
        switch (message.type) {
            case 'camera_frame':
                // Log the full message structure to debug
                console.log(`VideoClient: Frame message structure: ${JSON.stringify({
                    type: message.type,
                    id: message.id,
                    frameLength: message.frameData?.length,
                    timestamp: message.timestamp
                })}`);

                if (this.onCameraFrameReceived && message.id && message.frameData) {
                    // This is the legacy JSON/base64 path
                    this.onCameraFrameReceived(message.id, message.frameData);
                }
                break;
                
            case 'camera_request_acknowledged':
                console.log(`VideoClient: Camera request acknowledged for ship ${message.shipId}, enabled=${message.enabled}`);
                
                // Update active ship ID based on acknowledgment
                if (message.enabled) {
                    this.activeShipId = parseInt(message.shipId);
                } else if (this.activeShipId === parseInt(message.shipId)) {
                    this.activeShipId = null;
                }
                break;
                
            case 'camera_request_error':
                console.error(`VideoClient: Camera request error for ship ${message.shipId}: ${message.error}`);
                
                // If we get an error for the active ship, clear the active ship ID
                if (this.activeShipId === parseInt(message.shipId)) {
                    this.activeShipId = null;
                }
                break;
                
            default:
                console.warn(`VideoClient: Unhandled message type: ${message.type}`);
                break;
        }
    }
    
    protected processBinaryMessage(data: ArrayBuffer | Blob): void {
        const size = data instanceof Blob ? data.size : data.byteLength;
        console.log(`VideoClient: Processing binary video frame, size: ${size} bytes`);
        
        // Update the last frame received timestamp
        this.lastFrameReceived = Date.now();
        
        // We need to handle the binary protocol - first convert to ArrayBuffer if it's a Blob
        this.ensureArrayBuffer(data).then(buffer => {
            try {
                // Check for our 'VCAM' magic header to identify camera frames
                const headerView = new Uint8Array(buffer, 0, 4);
                const header = String.fromCharCode(...headerView);
                
                if (header === 'VCAM') {
                    // Parse the binary frame header we created in VideoServer.cs
                    const dataView = new DataView(buffer);
                    const shipId = dataView.getInt32(4, true); // true = little-endian
                    const timestamp = dataView.getFloat32(8, true);
                    const frameLength = dataView.getInt32(12, true);
                    
                    console.log(`VideoClient: Decoded binary frame: shipId=${shipId}, timestamp=${timestamp}, length=${frameLength}`);
                    
                    // Extract the JPEG data starting after the 16-byte header
                    const frameData = buffer.slice(16);
                    
                    // Create a Blob from the JPEG data
                    const blob = new Blob([frameData], { type: 'image/jpeg' });
                    
                    if (this.onCameraFrameReceived) {
                        this.onCameraFrameReceived(shipId, blob);
                    }
                } else {
                    console.warn('VideoClient: Received binary message with unknown format');
                }
            } catch (error) {
                console.error("VideoClient: Error processing binary frame:", error);
                // If we get an error processing the frame, the connection may be corrupted
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    console.warn("VideoClient: Error processing binary frame, attempting to reconnect");
                    this.reconnect();
                }
            }
        });
    }
    
    // Helper to ensure we have an ArrayBuffer to work with
    private async ensureArrayBuffer(data: ArrayBuffer | Blob): Promise<ArrayBuffer> {
        if (data instanceof Blob) {
            return await data.arrayBuffer();
        }
        return data;
    }
}