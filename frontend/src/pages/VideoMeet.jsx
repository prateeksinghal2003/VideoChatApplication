import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';

const server_url = server;

var connections = {};

// What is a STUN Server?
// STUN = Session Traversal Utilities for NAT
// It’s a small helper server used in video calls, voice calls, and real-time apps (like Zoom, WhatsApp, Google Meet).
// Its job is to help your computer/mobile find out its public IP address and port when it is behind a router (NAT).

// 🔹 Why do we need it?
// Normally:
// Your device has a private IP (like 192.168.x.x) inside your home WiFi.
// But the person you want to call only sees your public IP (given by your ISP).
// To connect directly (peer-to-peer), apps need to know:
// ✅ your public IP
// ✅ which port your router opened for you
// 👉 That’s exactly what a STUN server tells your app.
// 🔹 Example
// You open a video call app.
// The app asks the STUN server: "Hey, what’s my public IP and port?"
// STUN replies: "Your public IP is 103.22.xx.xx and you’re reachable at port 54321."
// Now your app can share this info with the other person → so you both can connect directly.


const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {



    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(true);

    let [audio, setAudio] = useState(true);

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        console.log("HELLO")
        getPermissions();

    })

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

//     Ask for camera permission

// Requests video access from the user.

// If granted → sets videoAvailable = true.

// If denied → sets videoAvailable = false.

// Ask for microphone permission

// Requests audio access from the user.

// If granted → sets audioAvailable = true.

// If denied → sets audioAvailable = false.

// Check if screen sharing is possible

// If the browser supports getDisplayMedia → sets screenAvailable = true.

// Otherwise → screenAvailable = false.

// If either video or audio is available

// Requests a combined MediaStream (video + audio) from the browser.

// Saves it to window.localStream so it can be reused.

// Sets it as the source of the local video element (localVideoref.current.srcObject) so the user can see their own video.

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

//srcObject is an in-built property of <audio> and <video> elements in the browser.
// What it does:
// Normally, for a <video> tag, you set the source with src:
// But when you want to play live media (like a webcam, microphone, or screen capture), there is no file/URL. Instead, you get a MediaStream object from getUserMedia().
// srcObject can accept a MediaStream, a MediaSource, or a Blob.

// In our case, userMediaStream is a MediaStream (from camera/mic).

// Once assigned, the video element will play the live stream.



    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);

        }


    }, [video, audio])

    let getMedia = () => {  
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }         




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)

                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
             setVideo(false);
             setAudio(false);

    //          if (track.kind === "video") {
    //     setVideo(false);
    // }
    // if (track.kind === "audio") {
    //     setAudio(false);
    // }

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }


//     This function activates your camera and/or microphone if you have permission and want them on.
// If either video or audio should be active, it asks the browser to give access.
// If access is granted, it calls another function (getUserMediaSuccess) to handle the stream.
// If both video and audio are OFF, it stops any existing tracks so nothing keeps running.
// Basically, it turns your camera/mic on or off depending on what you want.

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                // .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

//  When screen share starts → stop old streams.
// 	Replace local stream with the screen stream.
// 	Show it in your video element.
// 	Send it to all peers (so they see your screen).
// 	If screen share stops (user clicks stop):
// 	Turn off screen flag.
// 	Stop those tracks.
// 	Replace with dummy silent/black stream.
// 	Then switch back to camera/mic with getUserMedia.




        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

   

    let handleVideo = () => {
       // setVideo(!video);
        // getUserMedia();

        setVideo(prev => {
            const newVideo = !prev;
            if (window.localStream) {
                window.localStream.getVideoTracks().forEach(track => {
                    track.enabled = newVideo;
                });
            }
            return newVideo;
        });
      
    }

    
    

    let handleAudio = () => {
        setAudio(!audio)
        // getUserMedia();
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }


    return (
        <div>

            {askForUsername === true ?

                <div>


                    <h2>Enter into Lobby </h2>

                    {/* using material UI , read docs */}
            <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />

              <Button variant="contained" onClick={connect}   sx={{ ml: "1rem" }}>Connect</Button>

                         


                    <div>
                        <video ref={localVideoref} autoPlay muted></video>
                    </div>

                </div> :


                <div className={styles.meetVideoContainer}>

                    {showModal ? <div className={styles.chatRoom}>

                        <div className={styles.chatContainer}>
                            <h1>Chat</h1>

                            <div className={styles.chattingDisplay}>

                                {messages.length !== 0 ? messages.map((item, index) => {

                                    console.log(messages)
                                    return (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )
                                }) : <p>No Messages Yet</p>}


                            </div>

                            <div className={styles.chattingArea}>
                                <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
                                <Button variant='contained' onClick={sendMessage}>Send</Button>
                            </div>


                        </div>
                    </div> : <></>}


                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon  />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton> : <></>}

                        <Badge badgeContent={newMessages} max={999} color='orange'>
                            <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                <ChatIcon />                        </IconButton>
                        </Badge>

                    </div>


                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div key={video.socketId}>
                                <video

                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                >
                                </video>
                            </div>

                        ))}

                    </div>

                </div>

            }

        </div>
    )
}




//hiding video as well---------------------------
// import React, { useEffect, useRef, useState } from 'react'
// import io from "socket.io-client";
// import { Badge, IconButton, TextField, Button } from '@mui/material';
// import VideocamIcon from '@mui/icons-material/Videocam';
// import VideocamOffIcon from '@mui/icons-material/VideocamOff'
// import styles from "../styles/videoComponent.module.css";
// import CallEndIcon from '@mui/icons-material/CallEnd'
// import MicIcon from '@mui/icons-material/Mic'
// import MicOffIcon from '@mui/icons-material/MicOff'
// import ScreenShareIcon from '@mui/icons-material/ScreenShare';
// import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
// import ChatIcon from '@mui/icons-material/Chat'

// const server_url = "http://localhost:8000";

// var connections = {};

// const peerConfigConnections = {
//     "iceServers": [
//         { "urls": "stun:stun.l.google.com:19302" }
//     ]
// }

// export default function VideoMeetComponent() {

//     var socketRef = useRef();
//     let socketIdRef = useRef();

//     let localVideoref = useRef();

//     let [videoAvailable, setVideoAvailable] = useState(true);
//     let [audioAvailable, setAudioAvailable] = useState(true);

//     let [video, setVideo] = useState(true);
//     let [audio, setAudio] = useState(true);

//     let [screen, setScreen] = useState();
//     let [showModal, setModal] = useState(true);
//     let [screenAvailable, setScreenAvailable] = useState();

//     let [messages, setMessages] = useState([])
//     let [message, setMessage] = useState("");
//     let [newMessages, setNewMessages] = useState(3);

//     let [askForUsername, setAskForUsername] = useState(true);
//     let [username, setUsername] = useState("");

//     const videoRef = useRef([])
//     let [videos, setVideos] = useState([])

//     useEffect(() => {
//         console.log("HELLO")
//         getPermissions();
//     }, [])

//     let getDislayMedia = () => {
//         if (screen) {
//             if (navigator.mediaDevices.getDisplayMedia) {
//                 navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
//                     .then(getDislayMediaSuccess)
//                     .catch((e) => console.log(e))
//             }
//         }
//     }

//     const getPermissions = async () => {
//         try {
//             const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
//             if (videoPermission) {
//                 setVideoAvailable(true);
//                 console.log('Video permission granted');
//             } else {
//                 setVideoAvailable(false);
//                 console.log('Video permission denied');
//             }

//             const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
//             if (audioPermission) {
//                 setAudioAvailable(true);
//                 console.log('Audio permission granted');
//             } else {
//                 setAudioAvailable(false);
//                 console.log('Audio permission denied');
//             }

//             if (navigator.mediaDevices.getDisplayMedia) {
//                 setScreenAvailable(true);
//             } else {
//                 setScreenAvailable(false);
//             }

//             if (videoAvailable || audioAvailable) {
//                 const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
//                 if (userMediaStream) {
//                     window.localStream = userMediaStream;
//                     if (localVideoref.current) {
//                         localVideoref.current.srcObject = userMediaStream;
//                     }
//                 }
//             }
//         } catch (error) {
//             console.log(error);
//         }
//     };

//     useEffect(() => {
//         if (video !== undefined && audio !== undefined) {
//             getUserMedia();
//             console.log("SET STATE HAS ", video, audio);
//         }
//     }, [video, audio])

//     let getMedia = () => {
//         setVideo(videoAvailable);
//         setAudio(audioAvailable);
//         connectToSocketServer();
//     }

//     let getUserMediaSuccess = (stream) => {
//         try {
//             window.localStream.getTracks().forEach(track => track.stop())
//         } catch (e) { console.log(e) }

//         window.localStream = stream
//         localVideoref.current.srcObject = stream

//         for (let id in connections) {
//             if (id === socketIdRef.current) continue

//             connections[id].addStream(window.localStream)

//             connections[id].createOffer().then((description) => {
//                 connections[id].setLocalDescription(description)
//                     .then(() => {
//                         socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
//                     })
//                     .catch(e => console.log(e))
//             })
//         }
//     }

//     let getUserMedia = () => {
//         if ((video && videoAvailable) || (audio && audioAvailable)) {
//             navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
//                 .then(getUserMediaSuccess)
//                 .catch((e) => console.log(e))
//         } else {
//             try {
//                 let tracks = localVideoref.current.srcObject.getTracks()
//                 tracks.forEach(track => track.stop())
//             } catch (e) { }
//         }
//     }

//     let getDislayMediaSuccess = (stream) => {
//         try {
//             window.localStream.getTracks().forEach(track => track.stop())
//         } catch (e) { console.log(e) }

//         window.localStream = stream
//         localVideoref.current.srcObject = stream
//     }

//     let gotMessageFromServer = (fromId, message) => {
//         var signal = JSON.parse(message)

//         if (fromId !== socketIdRef.current) {
//             if (signal.sdp) {
//                 connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
//                     if (signal.sdp.type === 'offer') {
//                         connections[fromId].createAnswer().then((description) => {
//                             connections[fromId].setLocalDescription(description).then(() => {
//                                 socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
//                             }).catch(e => console.log(e))
//                         }).catch(e => console.log(e))
//                     }
//                 }).catch(e => console.log(e))
//             }

//             if (signal.ice) {
//                 connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
//             }
//         }
//     }

//     let connectToSocketServer = () => {
//         socketRef.current = io.connect(server_url, { secure: false })

//         socketRef.current.on('signal', gotMessageFromServer)

//         socketRef.current.on('connect', () => {
//             socketRef.current.emit('join-call', window.location.href)
//             socketIdRef.current = socketRef.current.id

//             socketRef.current.on('chat-message', addMessage)

//             socketRef.current.on('user-left', (id) => {
//                 setVideos((videos) => videos.filter((video) => video.socketId !== id))
//             })

//             socketRef.current.on('user-joined', (id, clients) => {
//                 clients.forEach((socketListId) => {
//                     connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

//                     connections[socketListId].onicecandidate = function (event) {
//                         if (event.candidate != null) {
//                             socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
//                         }
//                     }

//                     connections[socketListId].onaddstream = (event) => {
//                         let videoExists = videoRef.current.find(video => video.socketId === socketListId);

//                         if (videoExists) {
//                             setVideos(videos => {
//                                 const updatedVideos = videos.map(video =>
//                                     video.socketId === socketListId ? { ...video, stream: event.stream } : video
//                                 );
//                                 videoRef.current = updatedVideos;
//                                 return updatedVideos;
//                             });
//                         } else {
//                             let newVideo = {
//                                 socketId: socketListId,
//                                 stream: event.stream,
//                                 autoplay: true,
//                                 playsinline: true
//                             };

//                             setVideos(videos => {
//                                 const updatedVideos = [...videos, newVideo];
//                                 videoRef.current = updatedVideos;
//                                 return updatedVideos;
//                             });
//                         }
//                     };

//                     if (window.localStream) {
//                         connections[socketListId].addStream(window.localStream)
//                     }
//                 })
//             })
//         })
//     }

//     let handleVideo = () => {
//         setVideo(prev => {
//             const newVideo = !prev;
//             if (window.localStream) {
//                 window.localStream.getVideoTracks().forEach(track => {
//                     track.enabled = newVideo;
//                 });
//             }
//             return newVideo;
//         });
//     }

//     let handleAudio = () => {
//         setAudio(prev => {
//             const newAudio = !prev;
//             if (window.localStream) {
//                 window.localStream.getAudioTracks().forEach(track => {
//                     track.enabled = newAudio;
//                 });
//             }
//             return newAudio;
//         });
//     }

//     let handleScreen = () => {
//         setScreen(!screen);
//     }

//     let handleEndCall = () => {
//         try {
//             let tracks = localVideoref.current.srcObject.getTracks()
//             tracks.forEach(track => track.stop())
//         } catch (e) { }
//         window.location.href = "/"
//     }

//     let addMessage = (data, sender, socketIdSender) => {
//         setMessages((prevMessages) => [
//             ...prevMessages,
//             { sender: sender, data: data }
//         ]);
//         if (socketIdSender !== socketIdRef.current) {
//             setNewMessages((prevNewMessages) => prevNewMessages + 1);
//         }
//     };

//     let sendMessage = () => {
//         socketRef.current.emit('chat-message', message, username)
//         setMessage("");
//     }

//     let connect = () => {
//         setAskForUsername(false);
//         getMedia();
//     }

//     return (
//         <div>
//             {askForUsername === true ?
//                 <div>
//                     <h2>Enter into Lobby </h2>
//                     <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
//                     <Button variant="contained" onClick={connect} sx={{ ml: "1rem" }}>Connect</Button>
//                     <div>
//                         <video ref={localVideoref} autoPlay muted></video>
//                     </div>
//                 </div> :
//                 <div className={styles.meetVideoContainer}>
//                     {showModal ?
//                         <div className={styles.chatRoom}>
//                             <div className={styles.chatContainer}>
//                                 <h1>Chat</h1>
//                                 <div className={styles.chattingDisplay}>
//                                     {messages.length !== 0 ? messages.map((item, index) => (
//                                         <div style={{ marginBottom: "20px" }} key={index}>
//                                             <p style={{ fontWeight: "bold" }}>{item.sender}</p>
//                                             <p>{item.data}</p>
//                                         </div>
//                                     )) : <p>No Messages Yet</p>}
//                                 </div>
//                                 <div className={styles.chattingArea}>
//                                     <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
//                                     <Button variant='contained' onClick={sendMessage}>Send</Button>
//                                 </div>
//                             </div>
//                         </div> : null}

//                     <div className={styles.buttonContainers}>
//                         <IconButton onClick={handleVideo} style={{ color: "white" }}>
//                             {video ? <VideocamIcon /> : <VideocamOffIcon />}
//                         </IconButton>
//                         <IconButton onClick={handleEndCall} style={{ color: "red" }}>
//                             <CallEndIcon />
//                         </IconButton>
//                         <IconButton onClick={handleAudio} style={{ color: "white" }}>
//                             {audio ? <MicIcon /> : <MicOffIcon />}
//                         </IconButton>
//                         {screenAvailable &&
//                             <IconButton onClick={handleScreen} style={{ color: "white" }}>
//                                 {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
//                             </IconButton>}
//                         <Badge badgeContent={newMessages} max={999} color='orange'>
//                             <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
//                                 <ChatIcon />
//                             </IconButton>
//                         </Badge>
//                     </div>

//                     <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

//                     <div className={styles.conferenceView}>
//                         {videos.map((video) => (
//                             <div key={video.socketId}>
//                                 <video
//                                     data-socket={video.socketId}
//                                     ref={ref => {
//                                         if (ref && video.stream) {
//                                             ref.srcObject = video.stream;
//                                         }
//                                     }}
//                                     autoPlay
//                                 />
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             }
//         </div>
//     )
// }


