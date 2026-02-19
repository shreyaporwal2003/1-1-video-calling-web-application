import { useState, useEffect, useRef } from "react";
import { MdSend, MdClose } from "react-icons/md";

const Chat = ({ messages, onSendMessage, onClose }) => {
	const [newMessage, setNewMessage] = useState("");
	const messagesEndRef = useRef(null);
	
	// Drag state
	const [isDragging, setIsDragging] = useState(false);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const chatRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Initialize position (center-ish or respect css)
	useEffect(() => {
		if (chatRef.current) {
			// Optional: set initial position if needed, otherwise CSS handles it
		}
	}, []);

	// Drag handlers
	const handleMouseDown = (e) => {
		// Prevent drag if clicking a button (like close button)
		if (e.target.closest("button")) return;

		setIsDragging(true);
		if (chatRef.current) {
			setOffset({
				x: e.clientX - chatRef.current.getBoundingClientRect().left,
				y: e.clientY - chatRef.current.getBoundingClientRect().top
			});
		}
	};

	useEffect(() => {
		const handleMouseMove = (e) => {
			if (!isDragging) return;
			
			// Calculate new position relative to window, but we need to map it to absolute coords
			// A simpler way for fixed/absolute element:
			setPosition({
				x: e.clientX - offset.x,
				y: e.clientY - offset.y
			});
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		if (isDragging) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, offset]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!newMessage.trim()) return;

		onSendMessage(newMessage);
		setNewMessage("");
	};

	return (
		<div 
			className="chat-container" 
			ref={chatRef}
			style={ isDragging || position.x !== 0 ? { 
				top: position.y, 
				left: position.x, 
				right: 'auto', 
				bottom: 'auto',
				cursor: isDragging ? 'grabbing' : 'auto' 
			} : {}}
		>
			<div 
				className="chat-header" 
				onMouseDown={handleMouseDown}
				style={{ cursor: 'grab' }}
			>
				<h3>In-Call Messages</h3>
				<button onClick={onClose} className="close-chat-btn">
					<MdClose size={20} />
				</button>
			</div>

			<div className="chat-messages">
				{messages.length === 0 && <p className="no-messages">No messages yet</p>}
				{messages.map((msg, idx) => (
					<div key={idx} className={`message ${msg.isLocal ? "local" : "remote"}`}>
						<div className="message-sender">{msg.senderName}</div>
						<div className="message-text">{msg.text}</div>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>

			<form onSubmit={handleSubmit} className="chat-input-form">
				<input
					type="text"
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					placeholder="Send a message..."
				/>
				<button type="submit">
					<MdSend />
				</button>
			</form>
		</div>
	);
};

export default Chat;

