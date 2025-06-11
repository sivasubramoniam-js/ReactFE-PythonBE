import google.generativeai as genai
from flask_cors import CORS
from flask import Flask, jsonify, request, render_template
from textblob import Word
from googletrans import Translator
import json
import google.generativeai as genai

genai.configure(api_key='AIzaSyDhdMfC87MEU-DCfiG2zQLXmQTh7KtH_nA')
model = genai.GenerativeModel('gemini-1.5-flash')

def translate_text(text, dest_language):
    translator = Translator()
    translation = translator.translate(text, dest=dest_language)
    return f"{translation.text}" 

app = Flask(__name__,template_folder='../frontend/build',static_folder='../frontend/build/static')
CORS(app)

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/meaning', methods=['GET'])
def meaning():
  requested_word = request.args.get('word')
  word_meaning = Word(requested_word)
  print(word_meaning.definitions)
  return jsonify(word_meaning.definitions)

@app.route('/translate', methods=['POST'])
def translate():
  data = request.get_json()
  text_to_translate = data['message']
  destination_language = data['language']
  translated_text = translate_text(text_to_translate, destination_language)
  print(f"Translated text: {translated_text}")
  return jsonify({ "reply": translated_text})

@app.route('/chat', methods=['POST'])
def chat():
  data = request.get_json()
  text_to_translate = data['message']
  model_response = model.generate_content(f"{text_to_translate}. Generate response in html which will be placed as child element to the target parent. Exclude css and javascript.")
  return jsonify({ "reply": model_response.text.replace("\n", "<br>").replace("```html","```").replace("```","")})

@app.route('/languages', methods=['GET'])
def languages():
  with open('languages.json', 'r') as f:
    languages = json.load(f)
  return jsonify(languages)

@app.route('/generate', methods=['GET'])
def generate():
  
  return jsonify(generated_text)

if __name__ == "__main__":
  app.run(debug=True)