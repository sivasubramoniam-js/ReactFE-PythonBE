import google.generativeai as genai
from flask_cors import CORS
from flask import Flask, jsonify, request, render_template
from yt import search_youtube, get_subtitles_for_videos, generate_prompt
import json
from dotenv import load_dotenv
import os

app = Flask(__name__, template_folder='../frontend/build', static_folder='../frontend/build/static')
CORS(app)

load_dotenv()

genai.configure(api_key=os.getenv("API_KEY"))
generation_config = genai.types.GenerationConfig(
    max_output_tokens=None,
    temperature=1.0,
)
text_model = genai.GenerativeModel('gemini-pro', generation_config=generation_config)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/searchVideo', methods=['GET'])
def get_videos():
    keyword = request.args.get('keyword', default='', type=str)
    results = search_youtube(keyword)
    return jsonify({"result": results})

@app.route('/chat', methods=["POST"])
def chat():
    data = request.get_json()
    option = data.get("option")
    message = data.get("message")
    video_ids = data.get("id")
    
    subtitles = get_subtitles_for_videos(video_ids, option)
    
    try:
        response_format, prompt = generate_prompt(option, subtitles, message)
        model_resp = text_model.generate_content(prompt)
        
        response_text = clean_response_text(model_resp.text)
        isJsonResponse = check_json(response_text)
        subtitle_list = [{"id": video_ids, "content": response_text, "json": isJsonResponse}]
        
        return jsonify({'response': subtitle_list})
    
    except Exception as e:
        print(e)
        subtitle_list = [{"id": video_ids, "content": 'This video has some harmful content. Please choose a different video.'}]
        return jsonify({'response': subtitle_list})

def check_json(text):
    response = text.replace("json", "" ).replace("```", "")
    if isinstance(response, str):
        try:
            parsed = json.loads(response)
            if isinstance(parsed, (dict, list)):
                return parsed
            else:
                return False
        except json.JSONDecodeError:
            return False
    else:
        return False

def clean_response_text(text):
    return text.replace("json", "").replace("```", "")

if __name__ == "__main__":
    app.run(debug=True)
