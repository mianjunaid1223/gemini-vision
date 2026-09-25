# Gemini Vision: Real-Time Multimodal Video and Audio AI Assistant

Real-time browser-based computer vision and voice conversation assistant integrating Google Gemini multimodal APIs, WebRTC webcam capture, display surface capture, and Web Speech synthesis.

```
+-----------------------------------------------------------------------------------------+
|                                    Client Viewport                                      |
|                                                                                         |
|   +-----------------------------------+   +-----------------------------------------+   |
|   | MediaDevices Video Stream         |   | Web Speech API Recognition              |   |
|   | navigator.mediaDevices.getUserMedia|   | Continuous voice command transcription  |   |
|   | HTML5 Canvas frame snapshotting   |   | SpeechSynthesis vocal responses         |   |
|   +-----------------+-----------------+   +--------------------+--------------------+   |
|                     |                                          |                        |
|                     +---------------------+--------------------+                        |
|                                           |                                             |
|                                           v                                             |
|   +---------------------------------------------------------------------------------+   |
|   | REST / WebSocket Bridge: Frame serialization (image/jpeg base64) + user prompt  |   |
|   +---------------------------------------|-----------------------------------------+   |
+-------------------------------------------|---------------------------------------------+
                                            v
+-----------------------------------------------------------------------------------------+
|                                Flask Processing Gateway                                 |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   | Google Generative AI (Gemini 1.5 Pro / Flash Multimodal)                        |   |
|   | Visual reasoning, scene transcription, conversational dialogue synthesis        |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

## System Architecture

Gemini Vision implements an interactive conversational assistant capable of seeing and conversing with users in real time. The frontend extracts periodic visual frames from the user webcam or desktop screen share, pairs the imagery with speech-recognized audio prompts, and submits multimodal payloads to Google Gemini models.

### Subsystem Breakdown

1. Visual Capture Pipeline: Accesses user camera or screen streams through navigator.mediaDevices.getUserMedia and getDisplayMedia. Draws active video frames into hidden HTML5 Canvas elements and exports JPEG base64 payloads.

2. Voice Recognition and Audio Synthesis: Uses the browser Web Speech API (webkitSpeechRecognition) for hands-free audio command capture and synthesizes AI responses into audible speech using window.speechSynthesis.

3. Multimodal Analysis Gateway: Flask server routes images and contextual prompt histories to the Gemini API, returning concise real-time answers.

## Local Installation

```bash
git clone https://github.com/mianjunaid1223/gemini-vision.git
cd gemini-vision
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install flask google-generativeai python-dotenv
export GEMINI_API_KEY="your-api-key"
python app.py
```
