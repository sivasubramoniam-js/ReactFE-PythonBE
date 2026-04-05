import requests
import feedparser

# Supabase RSS endpoint
url = "https://zdpdvwhvukelzzbzbjvh.supabase.co/functions/v1/rss-feed"

# Make HTTP GET request
response = requests.get(url)

if response.status_code == 200:
    # Parse RSS feed
    feed = feedparser.parse(response.text)

    # Extract feed title (if available)
    print("Feed Title:", feed.feed.get("title", "No title found"))

    print("\nEntries:")
    # Loop through each item
    for entry in feed.entries:
        print("--------------")
        print("Title:", entry.get("title"))
        print("Link:", entry.get("link"))
        print("Published:", entry.get("published"))
        print("Description:", entry.get("description"))
else:
    print("Failed to fetch RSS. Status code:", response.status_code)