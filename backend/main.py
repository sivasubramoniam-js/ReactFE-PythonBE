import google.generativeai as genai
from flask_cors import CORS
from flask import Flask, jsonify, request, render_template
from io import BytesIO
from PIL import Image
import base64
import requests
genai.configure(api_key='AIzaSyDhdMfC87MEU-DCfiG2zQLXmQTh7KtH_nA')
model = genai.GenerativeModel('gemini-pro-vision')

app = Flask(__name__,template_folder='../frontend/build',static_folder='../frontend/build/static')
CORS(app)

@app.route('/processImageUrl',methods=['POST'])
def process_image_url():
    req=request.get_json()
    query = req.get('query','')
    url = req.get('url','')
    response = requests.get(url)
    try:
        response.raise_for_status()
        image_bytesio = BytesIO(response.content)
        img = Image.open(image_bytesio)
        if len(query):
            response = model.generate_content([query,img])
            response.resolve()
            return jsonify({'response':response.text})
        else:
            response = model.generate_content(img)
            response.resolve()
            return jsonify({'response':response.text})
    except Exception:
        response = model.generate_content(query)
        return jsonify({'response':response.text})


@app.route('/processImage',methods=['POST'])
def process_image():
    req=request.get_json()
    query = req.get('query','')
    url = req.get('url','')
    # response = requests.get(url)
    try:
        # response.raise_for_status()
        base64_str = url.split(',')[1]
        print(base64_str)

        image_bytesio = BytesIO(base64.b64decode(base64_str))
        print(image_bytesio)
        img = Image.open(image_bytesio)
        if len(query):
            response = model.generate_content([f"{query}",img])
            response.resolve()
            return jsonify({'response':response.text})
        else:
            response = model.generate_content(img)
            response.resolve()
            return jsonify({'response':response.text})
    except Exception:
        response = model.generate_content(query)
        return jsonify({'response':response.text})


@app.route('/')
def index():
  return render_template('index.html')

if __name__ == "__main__":
  app.run(debug=True)