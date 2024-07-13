export const Lobby = ({
    name,
    setJoined,
	setName,
	videoRef
}: {
    name: string,
    setJoined: React.Dispatch<React.SetStateAction<boolean>>,
	setName : any,
	videoRef: any
}) => {
	return (
		<div className="flex flex-col h-screen bg-gray-200 text-gray-800">
		<div className="flex flex-col items-center justify-center flex-grow">
			<video
				autoPlay
				className="w-96 h-72 mb-8 border border-gray-300 rounded-lg"
				ref={videoRef}
			></video>
			<input
				type="text"
				placeholder="Enter your name"
				className="w-80 px-4 py-2 border border-gray-700 text-white bg-gray-700  rounded-lg focus:outline-none"
				value={name}
				onChange={(e) => setName(e.target.value)}
			/>
			<button
				className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 focus:outline-none flex items-center justify-center"
				onClick={() => {
					if (name.trim() !== '') {
						setJoined(true);
					} else {
						alert('Please enter your name');
					}
				}}
			>
				Join
				<svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
				</svg>
			</button>
		</div>
	</div>
	)
}