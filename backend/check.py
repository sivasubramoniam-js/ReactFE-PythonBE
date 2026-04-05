from youtube_search import YoutubeSearch

def search_youtube(query, max_results=10):
    # Perform the search using youtube-search
    results = YoutubeSearch(query, max_results=max_results).to_dict()

    videos = []
    for video in results:
        duration = video.get('duration')
        
        if duration is not None:
            video_id = video.get('id')
            url = f"https://www.youtube.com/watch?v={video_id}"

            videos.append({
                'title': video.get('title'),
                'duration': duration,
                'url': url,
                'views': video.get('views'),
                'thumbnail': f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                'link': url,
                'id': video_id,
                'channel_name': video.get('channel'),
                'channel_thumbnail': None  # Not provided by youtube-search
            })

    return videos

print(search_youtube('angular', max_results=10))