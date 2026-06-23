import io from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';

const socket = io();


let localStream;
let remoteStream;
let buf = new BigUint64Array(1);
let room = "room" + crypto.getRandomValues(buf)
let pc;
let frameInterval = null;

// Audio capture state
let audioContext = null;
let audioProcessor = null;
let audioChunks = [];
const AUDIO_SAMPLE_RATE = 16000;
const AUDIO_CHUNK_SAMPLES = AUDIO_SAMPLE_RATE * 1; // 1-second chunks

const webcamButton = document.getElementById('webcamButton');
const callButton = document.getElementById('callButton');
const copyButton = document.getElementById('copyButton');
const answerButton = document.getElementById('answerButton');
const hangupButton = document.getElementById('hangupButton');
const webcamVideo = document.getElementById('webcamVideo');
const remoteVideo = document.getElementById('remoteVideo');
const logoutButton = document.getElementById('logoutButton');

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
    }
  ]
}

// Helper Functions
function createPeerConnection() {
  pc = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();
  pc.ontrack = event => {
    remoteStream.addTrack(event.track);
    console.log("stream received");
    // Start audio capture as soon as the remote audio track arrives
    if (event.track.kind === 'audio' && !audioContext) {
      startAudioCapture(remoteStream);
    }
  };
  remoteVideo.srcObject = remoteStream;

  pc.onicecandidate = event => {
    if (event.candidate) {
      console.log("Sent ICE Candidates");
      socket.emit('ice-candidate', {
        room, candidate: event.candidate
      })
    }
  }
}

function startFrameCapture(videoElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Send a frame every 200ms (~5 fps for analysis)
    frameInterval = setInterval(() => {
        if (videoElement.readyState < 2) return; // not ready yet
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0);
        const frameData = canvas.toDataURL('image/jpeg', 0.7);
        socket.emit('frame', { room, frame: frameData, sid: socket.id });
    }, 200);
    console.log("Frame capture started");
}

function stopFrameCapture() {
    if (frameInterval) {
        clearInterval(frameInterval);
        frameInterval = null;
        console.log("Frame capture stopped");
    }
}

async function startAudioCapture(stream) {
    try {
        audioContext = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });

        // Inline AudioWorklet processor to avoid a separate file and deprecated ScriptProcessorNode
        const workletCode = `
class AudioCaptureProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (input.length > 0) this.port.postMessage(input[0].slice());
        return true;
    }
}
registerProcessor('audio-capture-processor', AudioCaptureProcessor);`;
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        await audioContext.audioWorklet.addModule(blobUrl);
        URL.revokeObjectURL(blobUrl);

        const source = audioContext.createMediaStreamSource(stream);
        audioProcessor = new AudioWorkletNode(audioContext, 'audio-capture-processor');

        audioProcessor.port.onmessage = (e) => {
            audioChunks.push(e.data);

            const totalSamples = audioChunks.reduce((sum, c) => sum + c.length, 0);
            if (totalSamples < AUDIO_CHUNK_SAMPLES) return;

            const combined = new Float32Array(totalSamples);
            let offset = 0;
            for (const chunk of audioChunks) { combined.set(chunk, offset); offset += chunk.length; }
            audioChunks = [];

            // Encode as base64 in 32 KB slices to avoid stack overflow on large buffers
            const uint8 = new Uint8Array(combined.buffer);
            let binary = '';
            const SLICE = 0x8000;
            for (let i = 0; i < uint8.length; i += SLICE) {
                binary += String.fromCharCode(...uint8.subarray(i, i + SLICE));
            }
            socket.emit('audio_chunk', {
                room,
                audio: btoa(binary),
                sample_rate: AUDIO_SAMPLE_RATE,
                sid: socket.id,
            });
        };

        // Route through a silent gain node to keep the worklet alive without
        // playing audio through the low-quality 16 kHz AudioContext — remoteVideo
        // handles playback at full quality via its srcObject.
        const silentGain = audioContext.createGain();
        silentGain.gain.value = 0;
        source.connect(audioProcessor);
        audioProcessor.connect(silentGain);
        silentGain.connect(audioContext.destination);
        console.log("Audio capture started");
    } catch (err) {
        console.error("Audio capture failed to start:", err);
    }
}

function stopAudioCapture() {
    if (audioProcessor) {
        audioProcessor.disconnect();
        audioProcessor = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    audioChunks = [];
    console.log("Audio capture stopped");
}

// Start webcam
webcamButton.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
    webcamVideo.srcObject = localStream;
    webcamVideo.muted = true;  // prevent local mic echo
};

callButton.onclick = async () => {
  if (!localStream) {
    alert("Webcam isn't working, refresh and try again!");
    return;
  }
  createPeerConnection();
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  })
  socket.emit('join', {room});
  console.log("the room id is " + room);
  // Prints the room code to the page
  const para = document.createElement("p");
  const node = document.createTextNode("The Room ID: " + room);
  para.appendChild(node);
  const element = document.getElementById("create_call")
  element.appendChild(para);
}

answerButton.onclick = async () => {
  if (!localStream) {
    alert("Webcam is not on, please refresh the page and try again!");
    return;
  }
  createPeerConnection();
  room = document.getElementById("callInput").value.trim();
  const sanitized_room = room.replace(/[<>]/g, '');
  const element = document.getElementById("error_message");
  if (sanitized_room.length > 24 || sanitized_room.length < 5) {
    element.textContent = "Room ID " + room + " is invalid, try again!";
    return;
  }
  console.log("Sanitized " + sanitized_room);
  if (element) {
    element.textContent = '';
  }

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });
  console.log("made it here");
  socket.emit ('ans_join', {room});
}

copyButton.onclick = async () => {
  try {
    await navigator.clipboard.writeText(room);
  } catch (err) {
    console.log("Error: ", err);
  }
  alert("Copied to clipboard");
}

hangupButton.onclick = async () => {
    stopFrameCapture();
    stopAudioCapture();
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
    }
    if (pc) {
        pc.close();
        pc = null;
    }
    remoteVideo.srcObject = null;
};

logoutButton.onclick = async () => {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Successfully logged out:', data.message);
            window.location.href = '/login';
        } else {
          console.error('Logout failed: ', data.message);
        }
    } catch (error) {
        console.error('An error occurred during the logout process:', error);
    }
};

socket.on('ice-candidate', async (candidate) => {
  if (pc) {
    console.log('Received ice candidate');
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
})

socket.on('joined', async () => {
  if (pc) {
    console.log('Peer has joined, creating offer...');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("Local description is set!")
    socket.emit('offer', {room, offer});
  }
})

socket.on('offer', async (offer) => {
  if (!pc){
    createPeerConnection();
  }
  console.log("Received offer");
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('answer', {room, answer});
  // Connection established on the answerer side — start frame capture
  startFrameCapture(remoteVideo);
})

socket.on('answer', async (answer) => {
  if (pc) {
    console.log("Received answer");
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    // Connection established on the caller side — start frame capture
    startFrameCapture(remoteVideo);
  }
})

// Fix this later, want to essentially refresh the remote stream if the other user disconnects
// socket.on('disconnect', () => {
//     socket.emit('disconnect');
//     remoteVideo.removeAttribute('src');
//     remoteVideo.load();
// })

socket.on("failed join", async () => {
  console.log('User failed join');
  const element = document.getElementById("error_message");
  element.textContent = "The room " + room + " does not exist, please try again!";
})

socket.on('detection_update', (data) => {
  console.log(`[AI Detection] ${data.label} | ${data.fake_count}/${data.total} fake (${(data.fake_ratio * 100).toFixed(1)}%)`);
})

socket.on('ai_detected', (data) => {
  console.log('[AI Detection] DISCONNECTING:', data.message);
  alert(data.message);
  stopFrameCapture();
  stopAudioCapture();
  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
  }
  if (pc) {
    pc.close();
    pc = null;
  }
  remoteVideo.srcObject = null;
})

socket.on('audio_detection_update', (data) => {
  console.log(`[AI Audio] ${data.label} | ${data.fake_count}/${data.total} fake (${(data.fake_ratio * 100).toFixed(1)}%)`);
})