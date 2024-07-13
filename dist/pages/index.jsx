"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = require("react");
const google_1 = require("next/font/google");
const Navbar_1 = require("../component/Navbar");
const Room_1 = require("../component/Room");
const inter = (0, google_1.Inter)({ subsets: ["latin"] });
function Home() {
    const [name, setName] = (0, react_1.useState)("");
    const [localAudioTrack, setLocalAudioTrack] = (0, react_1.useState)(null);
    const [localVideoTrack, setlocalVideoTrack] = (0, react_1.useState)(null);
    const [darkMode, setDarkMode] = (0, react_1.useState)(false);
    const videoRef = (0, react_1.useRef)(null);
    const [joined, setJoined] = (0, react_1.useState)(false);
    const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        // MediaStream
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        setLocalAudioTrack(audioTrack);
        setlocalVideoTrack(videoTrack);
        if (!videoRef.current) {
            return;
        }
        videoRef.current.srcObject = new MediaStream([videoTrack]);
        videoRef.current.play();
        // MediaStream
    };
    (0, react_1.useEffect)(() => {
        if (videoRef && videoRef.current && !joined) {
			try{
				getCam();
			}
			catch (err){
				console.error('Error accessing camera:', err);
			}
		}
    }, [videoRef, joined]);
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };
    const handleSystemDarkModeChange = (event) => {
        setDarkMode(event.matches);
    };
    (0, react_1.useEffect)(() => {
        const systemDarkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setDarkMode(systemDarkModeQuery.matches);
        systemDarkModeQuery.addEventListener('change', handleSystemDarkModeChange);
        return () => {
            systemDarkModeQuery.removeEventListener('change', handleSystemDarkModeChange);
        };
    }, []);
    if (!joined) {
        return (<div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <Navbar_1.Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} name={""}/>
                <div className="flex flex-col items-center justify-center flex-grow">
                    <video autoPlay className="w-96 h-72 mb-8 border border-gray-300 rounded-lg" ref={videoRef}></video>
                    <input type="text" placeholder="Enter your name" className={`w-80 px-4 py-2 border ${darkMode ? 'border-gray-700 text-white bg-gray-700' : 'border-gray-300 bg-white'} rounded-lg focus:outline-none`} value={name} onChange={(e) => setName(e.target.value)}/>
                    <button className={`mt-4 px-6 py-2 ${darkMode ? 'bg-blue-500' : 'bg-blue-600'} text-white rounded-lg hover:bg-blue-700 focus:outline-none flex items-center justify-center`} onClick={() => {
                if (name.trim() !== '') {
                    setJoined(true);
                }
                else {
                    alert('Please enter your name');
                }
            }}>
                        Join
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </div>
            </div>);
    }
    return <Room_1.Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} setJoined={setJoined} darkMode={darkMode} setDarkMode={setDarkMode} toggleDarkMode={toggleDarkMode}/>;
}
