from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Simple Flask App</title>
    </head>
    <body>
        <h1>Hello from Flask!</h1>
        <p>This is a simple Flask application.</p>
    </body>
    </html>
    """

if __name__ == '__main__':
    # Use 0.0.0.0 as the host to make the application accessible externally
    app.run(host='0.0.0.0',port='3214')
