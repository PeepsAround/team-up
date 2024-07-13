import { useEffect, useRef, useState } from "react";

import { Navbar } from "./Navbar";
import io from 'socket.io-client';

export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack,
    setJoined,
}: {
    name: string,
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null,
    setJoined: React.Dispatch<React.SetStateAction<boolean>>
}) => {
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState<null | WebSocket>(null);
    const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
    const [sendingDc, setSendingDc] = useState<RTCDataChannel | null>(null);
    const [receivingDc, setReceivingDc] = useState<RTCDataChannel | null>(null);
    const [chat, setChat] = useState<string>("");
    const [chatMessages, setChatMessages] = useState<string[][]>([]);
    const [partnerName, setPartnerName] = useState<string>("");
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    function handleLeave() {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        setLobby(true)
        sendingPc?.close();
        setSendingPc(pc => {
            if (pc) {
                pc.onicecandidate = null;
                pc.onnegotiationneeded = null;
            }

            return pc;
        });
        setSendingPc(null);
        receivingPc?.close();
        setReceivingPc(pc => {
            if (pc) {
                pc.onicecandidate = null;
                pc.ontrack = null;
            }

            return pc;
        });
        setReceivingPc(null);
    }

    useEffect(() => {
		// const socket = new WebSocket(
		// 	// "wss://ccme03ln92.execute-api.eu-north-1.amazonaws.com/production/",
		// 	"ws://localhost:3000",
		// ); // Replace with your WebSocket server URL
		
		const socket = io('https://localhost:3000', {
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		  });

		function waitForAllICE(pc: RTCPeerConnection) {
			return new Promise((fufill, reject) => {
				pc.onicecandidate = (iceEvent : RTCPeerConnectionIceEvent) => {
					if (iceEvent.candidate === null) fufill("")
				}
					setTimeout(() => reject("Waited a long time for ice candidates..."), 10000)
			}) 
		} 
  
      // Function to handle messages
      const handleMessage = async (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);
        if (data.type === "send-offer") {
          const {roomId} = data;
          setLobby(false);
          const pc = new RTCPeerConnection();
					const dc = pc.createDataChannel("chat");

          if (localVideoTrack) {
              pc.addTrack(localVideoTrack)
          }
          if (localAudioTrack) {
              pc.addTrack(localAudioTrack)
          }

					pc.createOffer()
					.then(offer => pc.setLocalDescription(offer))
					.then(  ()  => waitForAllICE(pc))
					.then(  ()  => socket.send(JSON.stringify({ type: "offer", sdp: pc.localDescription, roomId: roomId })))
              
          setSendingDc(dc);
          setSendingPc(pc);
        } else if (data.type === "offer") {
          console.log("offer received")
          const {roomId, sdp: remoteSdp, partnerName} = data;
          setPartnerName(partnerName);
          setLobby(false);
          const pc = new RTCPeerConnection();
          
          const stream = new MediaStream();
          setRemoteMediaStream(stream)
          if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
          }
          
          pc.ontrack = (e) => {
              const {track, type} = e;
              if (type == 'audio') {
                  setRemoteAudioTrack(track);
                  // @ts-ignore
                  remoteVideoRef.current.srcObject.addTrack(track)
              } else {
                  setRemoteVideoTrack(track);
                  // @ts-ignore
                  remoteVideoRef.current.srcObject.addTrack(track)
              }
              //@ts-ignore
              remoteVideoRef.current.play();
          }

          pc.onicecandidate = (e) => {
              if (!e.candidate) {
                  return;
              }
              if (e.candidate) {
                  socket.send(JSON.stringify({ type: "add-ice-candidate", candidate: e.candidate, recipientType: "receiver", roomId: roomId }));
              }
          }
          const onReceiveMessage = (e: MessageEvent) => {
              setChatMessages(prevMessages => [[partnerName, e.data], ...prevMessages]);
          }
          const onReceiveChannelStateChange = () => { 
              setChatMessages([]);
            };

          pc.setRemoteDescription(remoteSdp)
					.catch((error) => console.log("error adding remote description on sender side", error))

					pc.createAnswer()
					.then(offer => pc.setLocalDescription(offer))
					.then(  ()  => waitForAllICE(pc))
					.then(  ()  => socket.send(JSON.stringify({ type: "answer", roomId, sdp: pc.localDescription })))
          
					pc.ondatachannel = (event) => {
						const dc = event.channel;
						dc.onmessage = onReceiveMessage;
						dc.onclose = onReceiveChannelStateChange;
						setReceivingDc(dc);
					}
					setReceivingPc(pc);
        } else if (data.type === "answer") {
          const {roomId, sdp: remoteSdp} = data;
          setLobby(false);
          setSendingPc(pc => {
              pc?.setRemoteDescription(remoteSdp)
							.catch((error) => console.log("error adding remote description on sender side", error))
              return pc;
          });
        } else if (data.type === "lobby") {
          setLobby(true);
        } else if (data.type === "add-ice-candidate") {
          const {candidate, recipientType} = data;
          if (recipientType == "sender") {
              setReceivingPc(pc => {
                if (!pc) {
                  console.error("receicng pc nout found")
                }
								console.log("adding ice to sender started");
                pc?.addIceCandidate(candidate)
								console.log("adding ice to sender completed");
                return pc;
              });
          } else {
              setSendingPc(pc => {
                if (!pc) {
                  console.error("sending pc nout found")
                }
								console.log("adding ice to receiver started", pc?.remoteDescription);
                pc?.addIceCandidate(candidate);
								console.log("adding ice to receiver completed");
                return pc;
              });
          }
        } else if (data.type === "leave") {
          handleLeave();
        }
      };
  
      // Listening for messages
      socket.addEventListener("message", handleMessage);
  
      // Send the initial message after the WebSocket connection is established
      socket.addEventListener("open", async () => {
        socket.send(JSON.stringify({ type: "initiate", name }));
      });

      setSocket(socket);
  
      return () => {
        // Clean up the event listener when component unmounts
        socket.removeEventListener("message", handleMessage);
        socket.close(); // Close the WebSocket connection
      };
    }, [name]);

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
				localVideoRef.current.play().then(() => {
				}).catch((error) => {
				});
            }
        }
    }, [localVideoRef])

    return (
        <div className={"flex flex-col h-screen bg-gray-900 text-white"}>
        <div className={"bg-gray-900 text-white h-full flex flex-col items-center justify-center py-8"}>
            <div className="flex w-full">
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-3/4">
                        <video autoPlay width={400} height={400} ref={localVideoRef} className="m-2" />
                        {lobby && <p className="text-gray-500 text-sm">Waiting to connect you to someone</p>}
                        <video autoPlay width={400} height={400} ref={remoteVideoRef} className="m-2" />
                        <div className="flex mt-4">
                            <button onClick={() => {
                                if (socket) {
                                    handleLeave();
                                    socket.send(JSON.stringify({ type: "leave" }));
                                }
                            }} className="px-4 py-2 bg-blue-500 text-white rounded-md mr-4 hover:bg-blue-600">Skip</button>
                            <button onClick={() => {
                                if (socket) {
                                    handleLeave();
                                    socket.send(JSON.stringify({ type: "disconnect" }));
                                    setJoined(false);
                                }
                            }} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Leave</button>
                        </div>
                    </div>
                </div>
                {/* Right Part */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    {!lobby && <div className=" w-1/2 text-left">You are now chatting with {partnerName}</div>}
                    <div className="w-1/2 bg-gray-700 p-4 rounded-lg shadow-md h-[600px] overflow-y-auto flex flex-col-reverse">
                        {chatMessages.map((message, index) => {
                            if (message[0] === "You") {
                                return (
                                <div key={index} className="flex flex-col items-start mb-4">
                                    <div className="bg-blue-500 rounded-md p-2 text-white max-w-64 break-words min-w-16">
                                        {message[1]}
                                    </div>
                                    <div className="text-xs">{message[0]}</div>
                                </div>
                                );
                            } else {
                                return (
                                <div key={index} className="flex flex-col items-end mb-4">
                                    <div className="bg-gray-200rounded-md p-2 text-gray-900 max-w-64 break-words min-w-16">
                                        {message[1]}
                                    </div>
                                    <div className="text-xs">{message[0]}</div>
                                </div>
                                );
                            }
                        })}
                    </div>
                    <div className="mt-4 w-1/2">
                        <input value={chat} placeholder="Message" onChange={(e) => setChat(e.target.value)} type="text" className="w-full px-4 py-2 border border-gray-700 text-white bg-gray-700 rounded-md focus:outline-none" />
                        <button onClick={() => {
                            if (sendingDc && chat.trim() !== "") {
                                setChatMessages(prevMessages => [["You", chat], ...prevMessages]);
                                sendingDc.send(chat);
                                setChat('');
                            }
                        }} className="w-full mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Send</button>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}

