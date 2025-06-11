# Install first:
# pip install duckduckgo-search
# pip install requests pillow

from duckduckgo_search import DDGS
import requests
from PIL import Image
from io import BytesIO

ddg_images = DDGS().images

def get_image_from_search(query):
    results = ddg_images(query, max_results=1)
    if results:
        image_url = results[0]['image']
        print(f"Found Image URL: {image_url}")

        response = requests.get(image_url)
        img = Image.open(BytesIO(response.content))
        img.show()
    else:
        print("No image found.")

# Example:
search_term = input("What image do you want? ")
get_image_from_search(search_term)
