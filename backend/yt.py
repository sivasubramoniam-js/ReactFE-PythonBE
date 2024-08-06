from youtubesearchpython import VideosSearch

def search_youtube(query, max_results=10):
    # Create a VideosSearch object
    videos_search = VideosSearch(query, limit=max_results)
    
    # Perform the search
    results = videos_search.result()
    
    # Extract video details
    videos = []
    for video in results.get('result', []):
        print(video)
        title = video['title']
        duration = video['duration']
        url = video['link']
        viewCount = video['viewCount']['short']
        thumbnail = video['thumbnails'][0]['url']
        link = video['link']
        videos.append({
            'title': title,
            'duration': duration,
            'url': url,
            "views": viewCount,
            "thumbnail": thumbnail,
            "link": link,
            "id": video['id'],
            "channel_name": video["channel"]["name"],
            "channel_thumbnail": video["channel"]["thumbnails"][0]["url"]
        })

    return videos