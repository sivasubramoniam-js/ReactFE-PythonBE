from youtubesearchpython import VideosSearch
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import SRTFormatter
import sqlite3

def search_youtube(query, max_results=10):
    # Create a VideosSearch object
    videos_search = VideosSearch(query, limit=max_results)
    
    # Perform the search
    results = videos_search.result()
    
    # Extract video details
    videos = []
    for video in results.get('result', []):
        title = video['title']
        duration = video['duration']
        url = video['link']
        viewCount = video['viewCount']['short']
        thumbnail = video['thumbnails'][0]['url']
        link = video['link']
        if duration != None:
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

def get_english_subtitles(video_id):
    try:
        # Fetch transcript for the given video_id
        # transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en','hi'])

        conn = sqlite3.connect("yt.db")
        cursor_read = conn.cursor()
        # Query the table
        query = f"SELECT * FROM yt_assistant WHERE video_id = '{video_id}'"
        cursor_read.execute(query)
        row = cursor_read.fetchone()
        columns = [desc[0] for desc in cursor_read.description]
        subtitles_text = ""
        subtitles_text_with_duration = ""
        subtitles_text_index = columns.index("subtitle")
        subtitles_text_with_duration_index = columns.index("subtitle_with_duration")

        if not row:
            transcript = None
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            for transcript_list_item in transcript_list:
                transcript_lang_code = transcript_list_item.language_code
                if transcript_lang_code != 'en':
                    for lang_obj in transcript_list_item.translation_languages:
                        if lang_obj["language_code"] == 'en' and transcript_list_item.is_translatable == True:
                            transcript = transcript_list_item.translate('en').fetch()
                            break
                else:
                    transcript = transcript_list_item.fetch()
            
            for entry in transcript:
                start_time = entry['start']
                duration = entry['duration']
                text = entry['text']
                
                # Format the subtitle entry as plain text
                subtitles_text += text + " "
                subtitles_text_with_duration += f"[{start_time:.2f} - {start_time + duration:.2f}] {text}\n"

            query = "INSERT INTO yt_assistant (subtitle_with_duration, subtitle, video_id) VALUES (?,?,?)"
            cursor = conn.cursor()
            cursor.execute(query, (subtitles_text_with_duration, subtitles_text, video_id,))
            conn.commit()
            cursor.close()
        else:
            subtitles_text = row[subtitles_text_index]
            subtitles_text_with_duration = row[subtitles_text_with_duration_index]
        return subtitles_text, subtitles_text_with_duration
    
    except Exception:
        return None


def get_subtitles_for_videos(video_ids, option):
    subtitles = []
    for video_id in video_ids:
        subtitles_text, subtitles_text_with_duration = get_english_subtitles(video_id)
        if option != 'jump':
            subtitles.append({'subtitle_id': video_id, 'subtitle_content': subtitles_text})
        else:
            subtitles.append({'subtitle_id': video_id, 'subtitle_content': subtitles_text_with_duration})
    return subtitles

def generate_prompt(option, subtitles, message):
    if option == 'chat':
        response_format = '''[{
            "id": "id of the subtitle which has relevant content",
            "response": "response for the user's ask. don't mention these words subtitle, file, content, transcript anywhere instead use the word video."
        },{
            "id": "id of the subtitle without any relevant content",
            "response": "this video don't have enough details, but this has context about ..."
        }]'''
        prompt = f'''Examine the subtitle_content of each object from {subtitles}. For the ask: {message}, generate response in the format {response_format} using the subtitle_content'''
    
    elif option == 'jump':
        response_format = '''[{
            "id": "id of the subtitle which has relevant content",
            "response": "response for the user's ask in less than 50 words. don't mention these words subtitle, file, content, transcript anywhere instead use the word video.",
            "hasContent": true,
            "info":[{
                "topic": "about the content 1",
                "start": "starting time of the particular concept/content in hh:mm:ss format",
                "end": "ending time of the particular concept/content. this is optional field, so if you are not sure then leave it blank",
            },{
                "topic": "about the content 2",
                "start": "starting time of the particular concept/content in hh:mm:ss format",
                "end": "ending time of the particular concept/content. this is optional field, so if you are not sure then leave it blank"
            }]
        },{
            "id": "id of the subtitle without any relevant content",
            "response": "this video don't have enough details, but this has context about ...",
            "hasContent": false,
            "info": null
        }]'''
        prompt = f'''Examine the subtitle_content of each object from {subtitles}. For the ask: {message}, generate response in the format {response_format} using the subtitle_content'''

    else:  # 'default' case
        response_format = '''[{
            "id": "id of the subtitle which has relevant content",
            "response": "reason in 25-50 words on why this file is preferable over the other. don't mention these words subtitle, file, content, transcript anywhere instead use the word video."
        }]'''
        prompt = f'''Please compare the content of the subtitle files {subtitles}. For the ask: {message}, provide the following:
            File ID: Identify the file that contains the most relevant content.
            Reason for Preference: Explain why this file is preferable over the other, focusing on the relevance of the content. Highlight specific points or aspects that make this file more appropriate for my needs.
            Also share response in the format: {response_format}
        '''
    
    return response_format, prompt
