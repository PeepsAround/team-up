import { useEffect, useRef, useState } from "react";

import { Room } from "../component/Room"; // Adjust the import path if needed

export default function Index() {
    const [name, setName] = useState("");
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [joined, setJoined] = useState(false);

    const getCam = async () => {
        try {
            const stream = await window.navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];
            setLocalAudioTrack(audioTrack);
            setLocalVideoTrack(videoTrack);

            if (videoRef.current) {
                videoRef.current.srcObject = new MediaStream([videoTrack]);
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(err => console.error("Video play error:", err));
                };
            }
        } catch (err) {
            console.error("Error accessing camera and microphone:", err);
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            getCam();
        }
    }, []);

    if (!joined) {
        return (
            <div>
                <video autoPlay ref={videoRef} width={400} height={300}></video>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                />
                <button onClick={() => setJoined(true)}>Join</button>
            </div>
        );
    }

    return (
        <Room
            name={name}
            localAudioTrack={localAudioTrack}
            localVideoTrack={localVideoTrack}
        />
    );
}