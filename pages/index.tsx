import { useEffect, useRef, useState } from "react";

import { Inter } from "next/font/google";
import { Lobby } from "@/component/Lobby";
import { Navbar } from "../component/Navbar";
import { Room } from "../component/Room";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
	const [joined, setJoined] = useState(false);
	const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
	const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	const [name, setName] = useState("");

	const getCam = async () => {
		try {
			const stream = await window.navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true
			})
			// MediaStream
			const audioTrack = stream.getAudioTracks()[0]
			const videoTrack = stream.getVideoTracks()[0]
			setLocalAudioTrack(audioTrack);
			setlocalVideoTrack(videoTrack);
			if (!videoRef.current) {
				return;
			}
			videoRef.current.srcObject = new MediaStream([videoTrack]);
			videoRef.current.play().then(() => {
			}).catch((error) => {
			});
			// MediaStream
		}
		catch (err) {
		}
	}

	useEffect(() => {
		if (videoRef.current && !joined) {
			getCam().catch((err) => {
			});
		}
	}, [videoRef]);


	return (
		<>
			<Navbar />
			{
				(!joined) ? <Lobby name={name} setJoined={setJoined} setName={setName} videoRef={videoRef} />
					:
					<Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} setJoined={setJoined} />
			}
		</>
	);
}
