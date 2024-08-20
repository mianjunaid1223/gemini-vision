const localVideo = document.getElementById('localVideo');
const chatMessages = document.getElementById('chat-messages');
const toggleVideoBtn = document.getElementById('toggle-video-btn');
const toggleAudioBtn = document.getElementById('toggle-audio-btn');
const startStopBtn = document.getElementById('start-stop-btn');
const shareScreenBtn = document.getElementById('share-screen-btn');
const textInput = document.getElementById('text-input');
const sendTextBtn = document.getElementById('send-text-btn');
const fullscreenVideoBtn = document.getElementById('fullscreen-video-btn');
const fullscreenChatBtn = document.getElementById('fullscreen-chat-btn');
const videoContainer = document.getElementById('video-container');
const chatContainer = document.getElementById('chat-container');
const appContainer = document.getElementById('app-container');
const controlsContainer = document.getElementById('controls-container');

let stream;
let recognition;
let isListening = false;
let isSpeaking = false;
let isConversationActive = false;
let isScreenSharing = false;
let isVideoEnabled = true;
let speechSynthesis;
let currentUtterance;
let femaleVoice;
function flip(bool){
    if (bool){
        localVideo.style.transform = 'rotateY(-180deg)'
    }
    else{
        localVideo.style.transform = 'rotateY(0deg)'
    }
}
function updateBodyState() {
    const body = document.body;
    const statusIndicator = document.getElementById('status-indicator');
    body.classList.remove('listening', 'speaking', 'processing', 'idle');

    if (isListening) {
        body.classList.add('listening');
    } else if (isSpeaking) {
        body.classList.add('speaking');
    } else if (body.classList.contains('processing')) {
        console.log('.')
    } else {
        body.classList.add('idle');
    }
}

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
        localVideo.srcObject = stream;
    } catch (error) {
        console.error('Error accessing media devices:', error);
        addChatMessage('System', `Error: Unable to access camera. ${error.message}`);
    }
}
function setupSpeechRecognition() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = event => {
            const transcript = event.results[0][0].transcript;
            if (!isSpeaking) {
                sendMessage(transcript, true);
            }
        };

        recognition.onend = () => {
            if (isListening && !isSpeaking) {

                setTimeout(() => {
                    if (isListening && !isSpeaking) {
                        recognition.start();
                        updateBodyState();
                    }
                }, 100);
            } else {
                recognition.stop();

                updateBodyState();
            }
        };

        recognition.onerror = event => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                if (isListening && !isSpeaking) {
                    recognition.stop();
                    setTimeout(() => {
                        if (isListening && !isSpeaking) {
                            recognition.start();
                            updateBodyState();
                        }
                    }, 100);
                }
            }
            updateBodyState();
        };
    } else {
        console.log('Speech recognition not supported');
        addChatMessage('System', 'Speech recognition is not supported in your browser.');
    }
}

function setupSpeechSynthesis() {
    speechSynthesis = window.speechSynthesis;

    speechSynthesis.onvoiceschanged = () => {
        const voices = speechSynthesis.getVoices();
        const femaleVoices = voices.filter(voice =>
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('girl')
        );

        femaleVoice = femaleVoices.length > 0 ? femaleVoices[0] : voices[0];
    };
}

function toggleConversation() {
    isConversationActive = !isConversationActive;
    if (isConversationActive) {
        startConversation();
    } else {
        stopConversation();
    }
}

function startConversation() {
    document.querySelector('#chat-input-container').classList.remove('debate');
    addChatMessage('System', 'Conversation started. Use the microphone button to toggle listening.');
    startStopBtn.querySelector('i').classList.replace('fa-play', 'fa-stop');
    isListening = true;
    updateMicrophoneUI();
    startListening();
}

function stopConversation() {
    document.querySelector('#chat-input-container').classList.add('debate');
    isListening = false;
    updateMicrophoneUI();
    stopListening();
    addChatMessage('System', 'Conversation stopped.');
    startStopBtn.querySelector('i').classList.replace('fa-stop', 'fa-play');
}

function captureImage() {
    const canvas = document.createElement('canvas');
    canvas.width = localVideo.videoWidth;
    canvas.height = localVideo.videoHeight;
    canvas.getContext('2d').drawImage(localVideo, 0, 0);
    return canvas.toDataURL('image/jpeg');
}

async function sendMessage(input, isSpeech = true) {
    if (!isConversationActive) {
        addChatMessage('System', 'Please start the conversation first.');
        return;
    }

    const imageData = isScreenSharing ? captureScreenshot() : captureImage();
    const message = {
        input: input,
        isSpeech: isSpeech,
        image: isScreenSharing ? null : imageData,
        screen: isScreenSharing ? imageData : null
    };

    addChatMessage('You', input);
    showProcessing();

    try {
        const response = await fetch('/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        hideProcessing();
        addChatMessage('Gemini', data.text);
    if (isSpeech){
    textToSpeech(data.text);
}

    } catch (error) {
        console.error('Error sending message:', error);
        hideProcessing();
        addChatMessage('System', `Error: Unable to send message. Please try again. (${error.message})`);
    }
}

function addChatMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${sender.toLowerCase()}`;
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showProcessing() {
    document.body.classList.add('processing');
    updateBodyState();
}

function hideProcessing() {
    document.body.classList.remove('processing');
    updateBodyState();
}

function removeEmojis(text) {
    const regex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]/gu;
    return text.replace(regex, '');
}

function textToSpeech(text) {
    isSpeaking = true;
    isListening = false;
    updateBodyState();

    if (speechSynthesis && speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }

    const message = new SpeechSynthesisUtterance();
    message.text = removeEmojis(text).replace(' AI ', ' A.I ');


    if (femaleVoice) {
        message.voice = femaleVoice;
    }

    currentUtterance = message;

    message.onstart = () => {
        if (recognition) {
            recognition.stop();
        }
        updateBodyState();
    };

    message.onend = () => {
        isSpeaking = false;
        if (isConversationActive) {
            setTimeout(() => {
                if (isConversationActive && !isSpeaking) {
                    isListening = true;
                    updateBodyState();
                    startListening();
                }
            }, 500);
        } else {
            updateBodyState();
        }
    };

    speechSynthesis.speak(message);
}

function toggleMicrophone() {
    if (!isConversationActive) {
        addChatMessage('System', 'Please start the conversation first.');
        return;
    }

    if (isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        isListening = true;
    } else {
        isListening = !isListening;
    }

    updateMicrophoneUI();
    updateBodyState();

    if (isListening) {
        startListening();
    } else {
        stopListening();
    }
}

function updateMicrophoneUI() {
    toggleAudioBtn.classList.toggle('enabled', isListening);
    toggleAudioBtn.classList.toggle('disabled', !isListening);
    toggleAudioBtn.innerHTML = isListening ? '<i class="fas fa-microphone"></i>' : '<i class="fas fa-microphone-slash"></i>';
}

function startListening() {
    if (recognition && !isSpeaking) {
        recognition.start();
        isListening = true;
        updateBodyState();
    }
}

function stopListening() {
    if (recognition) {
        recognition.stop();
        isListening = false;
        updateBodyState();
    }
}

function toggleVideo() {
    if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        isVideoEnabled = !isVideoEnabled;
        videoTrack.enabled = isVideoEnabled;
        toggleVideoBtn.classList.toggle('enabled', isVideoEnabled);
        toggleVideoBtn.classList.toggle('disabled', !isVideoEnabled);
        toggleVideoBtn.innerHTML = isVideoEnabled ? '<i class="fas fa-video"></i>' : '<i class="fas fa-video-slash"></i>';
    }
}

async function shareScreen() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        localVideo.srcObject = screenStream;
        isScreenSharing = true;
        flip(false)
        shareScreenBtn.innerHTML = '<i class="fas fa-stop-circle"></i>';
        shareScreenBtn.onclick = stopScreenSharing;
        shareScreenBtn.classList.add('enabled');
        shareScreenBtn.classList.remove('disabled');
        screenStream.getVideoTracks()[0].onended = () => {
            stopScreenSharing();
            shareScreenBtn.classList.remove('enabled');
            shareScreenBtn.classList.add('disabled');
        };
    } catch (error) {
        console.error('Error sharing screen:', error);
        addChatMessage('System', `Error: Unable to share screen. ${error.message}`);
    }
}

function stopScreenSharing() {
    if (isScreenSharing) {
        const screenTrack = localVideo.srcObject.getVideoTracks()[0];
        screenTrack.stop();
        localVideo.srcObject = stream;
        isScreenSharing = false;
        flip(true)
        shareScreenBtn.classList.remove('enabled');
        shareScreenBtn.classList.add('disabled');
        shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i>';
        shareScreenBtn.onclick = shareScreen;
    }
}

function captureScreenshot() {
    const canvas = document.createElement('canvas');
    canvas.width = localVideo.videoWidth;
    canvas.height = localVideo.videoHeight;
    canvas.getContext('2d').drawImage(localVideo, 0, 0);
    return canvas.toDataURL('image/jpeg');
}

function handleTextInput() {
    const text = textInput.value.trim();
    if (text) {
        sendMessage(text, false);
        textInput.value = '';
    }
}

function toggleViewportFullscreen(element, button) {
    if (!element.classList.contains('viewport-fullscreen')) {
        element.classList.add('viewport-fullscreen');
        button.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        element.classList.remove('viewport-fullscreen');
        button.innerHTML = '<i class="fas fa-expand"></i>';
    }
}

function toggleViewportFullscreenVideo() {
    toggleViewportFullscreen(videoContainer, fullscreenVideoBtn);
    videoContainer.classList.toggle('viewport-fullscreen-video');
}

function toggleViewportFullscreenChat() {
    toggleViewportFullscreen(chatContainer, fullscreenChatBtn);
}

// Event Listeners
fullscreenVideoBtn.addEventListener('click', toggleViewportFullscreenVideo);
fullscreenChatBtn.addEventListener('click', toggleViewportFullscreenChat);

fullscreenVideoBtn.addEventListener('click', () => {
    if (videoContainer.classList.contains('viewport-fullscreen-video')) {
        controlsContainer.classList.remove('hidden');
        videoContainer.appendChild(controlsContainer);
    } else {
        appContainer.appendChild(controlsContainer);
        controlsContainer.classList.remove('hidden');
    }
});

startStopBtn.addEventListener('click', toggleConversation);
toggleAudioBtn.addEventListener('click', toggleMicrophone);
toggleVideoBtn.addEventListener('click', toggleVideo);
shareScreenBtn.addEventListener('click', shareScreen);
sendTextBtn.addEventListener('click', handleTextInput);
textInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleTextInput();
    }
});

// Initialize
startCamera();
setupSpeechRecognition();
setupSpeechSynthesis();
updateMicrophoneUI();
updateBodyState();