from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("API_KEY"))
tools = types.Tool(google_search=types.GoogleSearch())
query = input("Enter your query: ")
consolidated_query = "Generate json response for the following query: " + query + " and the json should have the following fields: title, url(source), geo-coordinates, date, time. the geo-coordinates should be in the format of latitude and longitude and it should be accurate. If you are not sure about the coordinates, then atleast share the co-ordinates of the nearby place. Generate only the json response without any additional text."
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=consolidated_query,
    config=types.GenerateContentConfig(
        tools=[tools]
    )
)

print(response.text)