import google.generativeai as genai
from flask_cors import CORS
from flask import Flask, jsonify, request, render_template

app = Flask(__name__,template_folder='../frontend/build',static_folder='../frontend/build/static')
CORS(app)

@app.route('/')
def index():
  return render_template('index.html')

if __name__ == "__main__":
  app.run(debug=True)