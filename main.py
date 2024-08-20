import os
import base64
import tempfile
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import logging
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__, template_folder="template", static_folder="static")
app.config["SECRET_KEY"] = "q@ww23wqAA@3@#FD3gemini232323"
# Configure Gemini API
genai.configure(api_key="AIzaSyA1ea0SdwYbl7r7S6mLjAOtpAoSbpq-XEM")
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def save_temp_image(image_data):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
        temp_file.write(image_data)
        return temp_file.name


def delete_temp_file(file_path):
    try:
        os.unlink(file_path)
        logger.info(f"Deleted temporary file: {file_path}")
    except Exception as e:
        logger.error(f"Error deleting temporary file {file_path}: {str(e)}")


def is_mobile():
    user_agent = request.user_agent.string.lower()
    mobile_keywords = [
        "android",
        "webos",
        "iphone",
        "ipad",
        "ipod",
        "blackberry",
        "windows phone",
    ]
    return any(keyword in user_agent for keyword in mobile_keywords)


# Create a global chat instance
chat = genai.GenerativeModel("gemini-1.5-flash").start_chat(history=[])


@app.route("/")
def video_call():
    if is_mobile():
        return render_template("mobile.html")
    return render_template("index.html")


@app.route("/message", methods=["POST"])
def handle_message():
    temp_file_path = None
    try:
        data = request.json
        input_text = data.get("input", "")
        is_speech = data.get("isSpeech", True)
        image_data = data.get("image")
        screen_data = data.get("screen")
        if not input_text:
            raise ValueError("Input text is required.")
        image_part = None
        if image_data:
            image_data = base64.b64decode(image_data.split(",")[1])
            temp_file_path = save_temp_image(image_data)
            image_part = {"mime_type": "image/jpeg", "data": image_data}
        elif screen_data:
            screen_data = base64.b64decode(screen_data.split(",")[1])
            temp_file_path = save_temp_image(screen_data)
            image_part = {"mime_type": "image/jpeg", "data": screen_data}
        friendly_prompt = f"""You are Gemini-vision, an AI assistant skilled in multiple areas. Your task is to address users' problems directly without suggesting video calls. You can see the user through a camera or their shared screen.

Respond to their messages in a brief, casual manner, as if you're chatting face-to-face. Interact as if you're seeing them live, but don't explicitly mention seeing an image. Keep your responses concise and engaging, and only flag extremely inappropriate content. You cannot open any websites, but you can read and provide answers based on them. Always give straightforward answers without asking users to wait. Note that the mobile version is currently under development, so users can't open you on their phones.

The user said: "{input_text}"
Respond naturally to what you see and hear:"""
        response = chat.send_message(
            [friendly_prompt, image_part] if image_part else [friendly_prompt]
        )
        ai_response = response.text.strip()
        return jsonify({"text": ai_response})
    except Exception as e:
        logger.error(f"Error in handle_message: {str(e)}")
        return (
            jsonify(
                {
                    "text": "I'm having trouble understanding. Could you please try again?"
                }
            ),
            500,
        )
    finally:
        if temp_file_path:
            delete_temp_file(temp_file_path)


if __name__ == "__main__":
    logger.info(os.getenv("gemini_api_key" or "hello"))
    app.run(debug=True)
