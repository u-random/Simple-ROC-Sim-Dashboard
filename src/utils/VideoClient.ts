// src/utils/VideoClient.ts


import {BaseSocketClient, ConnectionState} from './BaseSocketClient';


export class VideoClient extends BaseSocketClient {
    private onCameraFrameReceived: ((shipId: number, frameData: string) => void) | null = null;

    constructor(
        serverIp: string,
        port: number = 3001,
        onCameraFrameReceived?: (shipId: number, frameData: string) => void,
        onConnectionStateChanged?: (state: ConnectionState) => void
    ) {
        super(serverIp, port, onConnectionStateChanged);
        this.onCameraFrameReceived = onCameraFrameReceived || null;
    }

    protected handleConnected(): void {
        // Register as ROC client for video
        this.sendMessage({
            type: 'register',
            role: 'roc',
            clientId: `roc-video-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        });
    }

    protected handleDisconnected(): void {
        // Nothing specific to do on disconnect for video client
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
                this.onCameraFrameReceived(message.id, message.frameData);
            }
        }
    }
}