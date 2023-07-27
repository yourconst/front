// URL to the server with the port we are using for WebSockets.
const webSocketUrl = 'ws://192.168.1.94:7777';
// The WebSocket object used to manage a connection.
let webSocketConnection = null;
// The RTCPeerConnection through which we engage in the SDP handshake.
let rtcPeerConnection = null;
// The data channel used to communicate.
let dataChannel = null;

const pingTimes = {};
const pingLatency = {};
let pingCount = 0;
const PINGS_PER_SECOND = 20;
const SECONDS_TO_PING = 20;
let pingInterval;
let startTime;

//let m = new Uint8Array(44);

// Callback for when we receive a message on the data channel.
function onDataChannelMessage(event) {
    let arr = new Uint8Array(event.data);

    infoDiv.innerText = arr[arr.length - 1];
    //console.log(event);
}

// Callback for when the data channel was successfully opened.
function onDataChannelOpen() {
  dataChannel.id = 1;
  console.log('Data channel opened!', dataChannel.id);
  //setInterval(()=>dataChannel.send(m.buffer), 1000);
}

// Callback for when the STUN server responds with the ICE candidates.
function onIceCandidate(event) {
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
  const config = { iceServers: [{ url: 'stun:stun.l.google.com:19302' }] };
  rtcPeerConnection = new RTCPeerConnection(config);
  rtcPeerConnection.ondatachannel = event=>{
    dataChannel = event.channel;
    dataChannel.onmessage = onDataChannelMessage;
    dataChannel.onopen = onDataChannelOpen;
  };
  rtcPeerConnection.onicecandidate = onIceCandidate;
}

// Callback for when we receive a message from the server via the WebSocket.
function onWebSocketMessage(event) {
  const messageObject = JSON.parse(event.data);
  if (messageObject.type === 'ping') {
    const key = messageObject.payload;
    pingLatency[key] = Date.now() - pingTimes[key];
  } else if (messageObject.type === 'offer') {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(messageObject.payload));
    rtcPeerConnection.createAnswer(onAnswerCreated, () => {}, sdpConstraints);
  } else if (messageObject.type === 'candidate') {
    rtcPeerConnection.addIceCandidate(new RTCIceCandidate(messageObject.payload));
  } else {
    console.log('Unrecognized WebSocket message type.');
  }
}

// Connects by creating a new WebSocket connection and associating some callbacks.
function connect() {
  webSocketConnection = new WebSocket(webSocketUrl);
  webSocketConnection.onopen = onWebSocketOpen;
  webSocketConnection.onmessage = onWebSocketMessage;
}

function printLatency() {
  for (let i = 0; i < PINGS_PER_SECOND * SECONDS_TO_PING; i++) {
    console.log(i + ': ' + pingLatency[i + '']);
  }
}

function sendDataChannelPing() {
  const key = pingCount + '';
  pingTimes[key] = Date.now();
  dataChannel.send(key);
  pingCount++;
  if (pingCount === PINGS_PER_SECOND * SECONDS_TO_PING) {
    clearInterval(pingInterval);
    console.log('total time: ' + (Date.now() - startTime));
    setTimeout(printLatency, 10000);
  }
}

function sendWebSocketPing() {
  const key = pingCount + '';
  pingTimes[key] = Date.now();
  webSocketConnection.send(JSON.stringify({type: 'ping', payload: key}));
  pingCount++;
  if (pingCount === PINGS_PER_SECOND * SECONDS_TO_PING) {
    clearInterval(pingInterval);
    console.log('total time: ' + (Date.now() - startTime));
    setTimeout(printLatency, 10000);
  }
}

// Pings the server via the DataChannel once the connection has been established.
function ping() {
  startTime = Date.now();
  // pingInterval = setInterval(sendDataChannelPing, 1000.0 / PINGS_PER_SECOND);
  pingInterval = setInterval(sendWebSocketPing, 1000.0 / PINGS_PER_SECOND);
}