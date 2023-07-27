const w = require("wrtc"),
    WS = require("../sws"),
    ws = new WS(7777),
    CONNS = new Map;

let webSocketConnection = null;
// The RTCPeerConnection through which we engage in the SDP handshake.
let rtcPeerConnection = null;
// The data channel used to communicate.
let dataChannel = null;

const pingTimes = {};
const pingLatency = {};

let m = new Uint8Array(5e3);

function randArr(arr) {
    for(let i=0;i<arr.length; ++i)
        arr[i] = 256 * Math.random();
}

// Callback for when we receive a message on the data channel.
function onDataChannelMessage(event) {
  console.log(event);
}

// Callback for when the data channel was successfully opened.
function onDataChannelOpen() {
  console.log('Data channel opened!', dataChannel.id);
  setInterval(()=>{
      randArr(m);
      console.log(m[m.length-1]);
  }, 1111);
  setInterval(()=>dataChannel.send(m.buffer), 16);
}    

// Callback for when the STUN server responds with the ICE candidates.
function onIceCandidate(event) {
    //console.log(event);
    if (event && event.candidate) {
    webSocketConnection.send(JSON.stringify({type: 'candidate', payload: event.candidate}));
    }
}

// Callback for when the SDP offer was successfully created.
function onAnswerCreated(description) {
    //console.log(description);
    rtcPeerConnection.setLocalDescription(description);
    webSocketConnection.send(JSON.stringify({
        type: 'answer', payload: rtcPeerConnection.localDescription
    }));
}

const sdpConstraints = {
    mandatory: {
      OfferToReceiveAudio: false,
      OfferToReceiveVideo: false,
    },
  };
// Callback for when the WebSocket is successfully opened.
function onWebSocketOpen() {
  const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  rtcPeerConnection = new w.RTCPeerConnection(config);
  const dataChannelConfig = { ordered: false, maxRetransmits: 0 };
  dataChannel = rtcPeerConnection.createDataChannel('dc', dataChannelConfig);
  dataChannel.onmessage = onDataChannelMessage;
  dataChannel.onopen = onDataChannelOpen;
  rtcPeerConnection.onicecandidate = onIceCandidate;
}

// Callback for when we receive a message from the server via the WebSocket.
function onWebSocketMessage(messageObject) {
  if (messageObject.type === 'ping') {
    const key = messageObject.payload;
    pingLatency[key] = Date.now() - pingTimes[key];
  } else if (messageObject.type === 'offer') {
    console.log(rtcPeerConnection.localDescription);
    rtcPeerConnection.setRemoteDescription(new w.RTCSessionDescription(messageObject.payload));
    rtcPeerConnection.createAnswer(onAnswerCreated, () => {}, sdpConstraints);
    console.log(rtcPeerConnection.localDescription);
  } else if (messageObject.type === 'candidate') {
    rtcPeerConnection.addIceCandidate(new w.RTCIceCandidate(messageObject.payload));
  } else {
    console.log('Unrecognized WebSocket message type.');
  }
}


function randInt(maxlen) {
	var res = Math.trunc(Math.pow(10, maxlen) * Math.random());

	return res;
}

ws.onConnection = conn => {
    conn.id = randInt(32);
    webSocketConnection = conn;
    
    onWebSocketOpen();
};

ws.onMessage = (msg, conn) => {
    onWebSocketMessage(msg);
};

ws.onClose = conn => {
    
};