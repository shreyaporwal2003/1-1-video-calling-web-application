# 🎥 WebRTC Video Call App

A modern, real-time video calling application built with React and WebRTC.

![Video Call Demo](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?style=for-the-badge&logo=socket.io&logoColor=white)

## ✨ Features

- 🎬 **Real-time Video Calling** - High-quality peer-to-peer video communication using WebRTC
- 🎙️ **Audio/Video Controls** - Toggle microphone and camera on/off during calls
- 📹 **Picture-in-Picture** - Click any video to swap between large and thumbnail views
- 🎨 **Modern UI** - Clean, Google Meet-inspired dark theme interface
- 📱 **Fully Responsive** - Seamless experience across desktop, tablet, and mobile devices
- 🔐 **Room-based System** - Create or join private rooms with unique IDs
- ⚡ **Low Latency** - Direct peer-to-peer connections for minimal delay
- 🎯 **Easy to Use** - Simple, intuitive interface for quick video calls


## 🚀 Demo

[[Live Demo Link](https://1-1-video-calling-web-application.vercel.app/)]

## 📸 Screenshots

### Pre-Join Screen
![Pre-Join Screen](frontend/Screenshot%202026-02-03%20153424.png)


### Video Call Interface
![Video Call Interface](frontend/Screenshot%202026-02-05%20161553.png)




## 🛠️ Tech Stack

**Frontend:**
- React 18+
- WebRTC API
- Socket.io Client
- CSS3 (Custom styling)

**Backend:**
- Node.js
- Express.js
- Socket.io Server
- CORS enabled

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with WebRTC support (Chrome, Firefox, Edge, Safari)
- Camera and microphone access

## 💻 Installation

### 1. Clone the repository

```bash
git clone https://github.com/shreyaporwal2003/1-1-video-calling-web-application.git
cd 1-1-video-calling-web-application
```

### 2. Install dependencies

**Frontend:**
```bash
cd client
npm install
```

**Backend:**
```bash
cd server
npm install
```

### 3. Configure Socket.io connection

Update the socket connection URL in your frontend `socket.js`:

```javascript
// src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:3001"); // Change to your backend URL

export default socket;
```

### 4. Start the servers

**Backend (Terminal 1):**
```bash
cd server
npm start
# Server runs on http://localhost:3001
```

**Frontend (Terminal 2):**
```bash
cd client
npm start
# App runs on http://localhost:3000
```

## 🎯 Usage

### Creating a Call

1. Open the app in your browser
2. Allow camera and microphone permissions
3. Click **"Create New Call"**
4. Share the generated Room ID with others
5. Wait for participants to join

### Joining a Call

1. Open the app in your browser
2. Allow camera and microphone permissions
3. Enter the Room ID provided by the host
4. Click **"Join Call"**

### During the Call

- 🎤 **Toggle Microphone** - Click the mic button to mute/unmute
- 📹 **Toggle Camera** - Click the camera button to turn video on/off
- 🔄 **Swap Views** - Click on any video to switch between large and thumbnail view
- 📞 **End Call** - Click the red "End" button to leave the call

## 📁 Project Structure

```
webrtc-video-call/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Call.jsx       # Main call interface
│   │   │   └── PreJoin.jsx    # Pre-join screen
│   │   ├── App.jsx
│   │   ├── socket.js          # Socket.io client config
│   │   └── app.css         # Global styles
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── index.js           # Socket.io server
│   └── package.json
│
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
```

Create a `.env` file in the client directory:

```env
REACT_APP_BACKEND_URL=http://localhost:3001
```

### STUN/TURN Servers

For better connectivity across different networks, configure STUN/TURN servers in `Call.jsx`:

```javascript
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Add TURN servers for production
  ]
});
```

## 🌐 Deployment

### Frontend (Vercel/Netlify)

1. Build the React app:
```bash
cd client
npm run build
```

2. Deploy the `build` folder to your hosting platform

### Backend (Heroku/Railway/Render)

1. Ensure your `server/index.js` uses environment port:
```javascript
const PORT = process.env.PORT || 3001;
```

2. Deploy to your chosen platform

3. Update the frontend socket URL to your deployed backend

## 🐛 Troubleshooting

### Camera/Microphone Not Working
- Ensure browser permissions are granted
- Check if other apps are using the camera
- Try using HTTPS (required for some browsers)

### Connection Issues
- Verify both users have stable internet
- Check firewall settings
- Consider adding TURN servers for production

### Video Quality Issues
- Check network bandwidth
- Reduce video resolution in getUserMedia constraints
- Ensure CPU isn't overloaded


## 👨‍💻 Author

**Your Name**
- GitHub: [@ShreyaPorwal](https://github.com/shreyaporwal2003)
- Email: shreyaporwal167@gmail.com

## 🙏 Acknowledgments

- WebRTC documentation and examples
- Socket.io team for real-time communication
- Google Meet for UI/UX inspiration
- React community for excellent documentation


## 🔮 Future Enhancements

- [ ] Screen sharing functionality
- [ ] Group video calls (3+ participants)
- [ ] Chat messaging during calls
- [ ] Recording functionality
- [ ] Virtual backgrounds
- [ ] Call quality indicators
- [ ] User authentication
- [ ] Call history
- [ ] Noise cancellation
- [ ] Waiting room feature

---

⭐ Star this repo if you find it helpful!

Made with ❤️ using React and WebRTC
