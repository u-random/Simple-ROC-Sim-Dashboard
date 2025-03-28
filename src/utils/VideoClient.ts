// src/utils/VideoClient.ts


import {BaseSocketClient, ConnectionState} from './BaseSocketClient';


export class VideoClient extends BaseSocketClient {
    private onCameraFrameReceived: ((shipId: number, frameData: string | Blob) => void) | null = null;

    constructor(
        serverIp: string,
        port: number = 3001,
        onCameraFrameReceived?: (shipId: number, frameData: string | Blob) => void,
        onConnectionStateChanged?: (state: ConnectionState) => void
    ) {
        super(serverIp, port, onConnectionStateChanged);
        this.onCameraFrameReceived = onCameraFrameReceived || null;
    }

    protected handleConnected(): void {
        // Register as ROC client for video
        const success = this.sendMessage({
            type: 'register',
            role: 'roc',
            clientId: `roc-video-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        });
        
        console.log(`VideoClient: Registration message sent, success=${success}`);
        
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
        console.log(message);
        if (message.type === 'camera_frame') {
            // Log the full message structure to debug
            console.log(`Frame message structure: ${JSON.stringify({
                type: message.type,
                id: message.id,
                frameLength: message.frameData?.length,
                timestamp: message.timestamp
            })}`);

            if (this.onCameraFrameReceived && message.id && message.frameData) {
                // This is the legacy JSON/base64 path
                this.onCameraFrameReceived(message.id, message.frameData);
            }
        }
    }
    
    protected processBinaryMessage(data: ArrayBuffer | Blob): void {
        const size = data instanceof Blob ? data.size : data.byteLength;
        console.log(`Processing binary video frame, size: ${size} bytes`);
        
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
                    
                    console.log(`Decoded binary frame: shipId=${shipId}, timestamp=${timestamp}, length=${frameLength}`);
                    
                    // Extract the JPEG data starting after the 16-byte header
                    const frameData = buffer.slice(16);
                    
                    // Create a Blob from the JPEG data
                    const blob = new Blob([frameData], { type: 'image/jpeg' });
                    
                    if (this.onCameraFrameReceived) {
                        this.onCameraFrameReceived(shipId, blob);
                    }
                } else {
                    console.warn('Received binary message with unknown format');
                }
            } catch (error) {
                console.error("Error processing binary frame:", error);
                // If we get an error processing the frame, the connection may be corrupted
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    console.warn("Error processing binary frame, attempting to reconnect");
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