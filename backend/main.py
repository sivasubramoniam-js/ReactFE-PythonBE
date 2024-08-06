import google.generativeai as genai
from flask_cors import CORS
from flask import Flask, jsonify, request, render_template
from yt import search_youtube

app = Flask(__name__,template_folder='../frontend/build',static_folder='../frontend/build/static')
CORS(app)

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/searchVideo', methods=['GET'])
def get_videos():
  keyword = request.args.get('keyword', default='', type=str)
  results = search_youtube(keyword)
  return jsonify({"result" : results})
  

if __name__ == "__main__":
  app.run(debug=True)