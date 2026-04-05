from youtube_search import YoutubeSearch
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import SRTFormatter
import sqlite3
import yt_dlp
import os
import google.generativeai as genai
from dotenv import load_dotenv
import time
import json
import speech_recognition as sr
from pydub import AudioSegment
from pydub.utils import make_chunks
import subprocess
from deep_translator import GoogleTranslator

# Set pydub to use the local ffmpeg
AudioSegment.converter = os.path.abspath("./ffmpeg")

load_dotenv()
if os.getenv("API_KEY"):
    genai.configure(api_key=os.getenv("API_KEY"))


def search_youtube(query, max_results=10):
    # Perform the search using youtube-search
    results = YoutubeSearch(query, max_results=max_results).to_dict()

    videos = []
    for video in results:
        print(video)
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

def download_audio(video_id):
    audio_dir = "temp_audio"
    if not os.path.exists(audio_dir):
        os.makedirs(audio_dir)
    
    file_path = os.path.join(audio_dir, f"{video_id}.m4a")
    
    ydl_opts = {
        'format': 'm4a/bestaudio/best',
        'outtmpl': os.path.join(audio_dir, f"{video_id}.%(ext)s"),
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=True)
            # Find the actual file path (yt-dlp might use a different extension if m4a is not available, 
            # though we requested it. Let's be safe.)
            ext = info.get('ext', 'm4a')
            actual_file_path = os.path.join(audio_dir, f"{video_id}.{ext}")
            return actual_file_path
    except Exception as e:
        print(f"Error downloading audio for {video_id}: {e}")
        return None

def convert_to_wav(input_file):
    output_file = input_file.rsplit('.', 1)[0] + ".wav"
    try:
        # Use the local ffmpeg
        ffmpeg_path = "./ffmpeg"
        command = [
            ffmpeg_path, "-i", input_file,
            "-ar", "16000", "-ac", "1",
            "-y", output_file
        ]
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_file
    except Exception as e:
        print(f"FFmpeg conversion error: {e}")
        return None

def transcribe_audio(file_path):
    try:
        if not os.path.exists(file_path):
            return None
        
        # 1. Convert to wav
        print(f"Converting {file_path} to wav...")
        wav_path = convert_to_wav(file_path)
        if not wav_path:
            return None
        
        # 2. Chunking for robust transcription
        print("Chunking audio...")
        audio = AudioSegment.from_wav(wav_path)
        chunk_length_ms = 30000  # 30-second chunks are good for Google STT
        chunks = make_chunks(audio, chunk_length_ms)
        
        r = sr.Recognizer()
        transcript = []
        
        print(f"Transcribing {len(chunks)} chunks using Google STT...")
        for i, chunk in enumerate(chunks):
            chunk_file = f"temp_audio/chunk_{i}.wav"
            chunk.export(chunk_file, format="wav")
            
            with sr.AudioFile(chunk_file) as source:
                audio_data = r.record(source)
                try:
                    # use any speech to text identifier (Google)
                    text = r.recognize_google(audio_data)
                    start_sec = (i * chunk_length_ms) / 1000.0
                    duration = len(chunk) / 1000.0
                    transcript.append({
                        "start": round(start_sec, 2),
                        "duration": round(duration, 2),
                        "text": text
                    })
                except sr.UnknownValueError:
                    print(f"Chunk {i}: Speech was unintelligible")
                except sr.RequestError as e:
                    print(f"Chunk {i}: Google STT error; {e}")
            
            # Delete chunk
            if os.path.exists(chunk_file):
                os.remove(chunk_file)
        
        # Clean up wav
        if os.path.exists(wav_path):
            os.remove(wav_path)

        if not transcript:
            return None

        # 3. Translate to English using Google Trans (via deep-translator)
        print("Checking for translation/eng-normalization using Google Trans...")
        try:
            translator = GoogleTranslator(source='auto', target='en')
            for entry in transcript:
                text = entry.get('text', '')
                if text.strip():
                    try:
                        entry['text'] = translator.translate(text)
                    except:
                        pass # Keep original if failed
            return transcript
        except Exception as te:
            print(f"Deep Translator error in yt.py: {te}")
            return transcript
            
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return None
    finally:
        # Clean up original audio file
        if os.path.exists(file_path):
            os.remove(file_path)

def get_english_subtitles(video_id):
    try:
        conn = sqlite3.connect("yt.db")
        cursor_read = conn.cursor()
        cursor_read.execute("CREATE TABLE IF NOT EXISTS yt_assistant (video_id TEXT PRIMARY KEY, subtitle_with_duration TEXT, subtitle TEXT)")
        
        query = f"SELECT * FROM yt_assistant WHERE video_id = '{video_id}'"
        cursor_read.execute(query)
        row = cursor_read.fetchone()
        
        if not row:
            print(f"Fetching subtitles for video ID: {video_id}")
            transcript = None
            try:
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                # Try to find an English transcript directly
                try:
                    transcript = transcript_list.find_transcript(['en']).fetch()
                    print("Transcript fetched in 'en' language")
                except Exception:
                    # If not available, try to translate another transcript to English
                    for transcript_list_item in transcript_list:
                        if transcript_list_item.is_translatable:
                            try:
                                transcript = transcript_list_item.translate('en').fetch()
                                print(f"Transcript translated from {transcript_list_item.language_code} to 'en'")
                                break
                            except Exception:
                                continue
            except Exception as e:
                print(f"No built-in transcripts found: {e}")

            if transcript is None:
                print("No transcripts found, attempting audio transcription fallback...")
                audio_file = download_audio(video_id)
                if audio_file:
                    transcript = transcribe_audio(audio_file)
                
            if transcript is None:
                raise Exception("Could not retrieve or generate subtitles.")

            print("trans ready")
            subtitles_text = ""
            subtitles_text_with_duration = ""
            for entry in transcript:
                if isinstance(entry, dict):
                    # Handle both YouTubeTranscriptApi format and our Gemini format
                    start_time = entry.get('start', 0.0)
                    duration = entry.get('duration', 0.0)
                    text = entry.get('text', '')
                else:
                    # Should not happen with new logic but being safe
                    continue
                
                subtitles_text += text + " "
                subtitles_text_with_duration += f"[{start_time:.2f} - {start_time + duration:.2f}] {text}\n"
            
            print("inserting.....")
            query = "INSERT INTO yt_assistant (subtitle_with_duration, subtitle, video_id) VALUES (?,?,?)"
            cursor = conn.cursor()
            cursor.execute(query, (subtitles_text_with_duration, subtitles_text, video_id,))
            conn.commit()
            cursor.close()
        else:
            print(f"Subtitles already fetched for video ID: {video_id}")
            columns = [desc[0] for desc in cursor_read.description]
            subtitles_text_index = columns.index("subtitle")
            subtitles_text_with_duration_index = columns.index("subtitle_with_duration")
            subtitles_text = row[subtitles_text_index]
            subtitles_text_with_duration = row[subtitles_text_with_duration_index]
        
        conn.close()
        return subtitles_text, subtitles_text_with_duration
    
    except Exception as e:
        print(f"Error fetching subtitles for video ID {video_id}: {e}")
        return None, None


def get_subtitles_for_videos(video_ids, option):
    subtitles = []
    for video_id in video_ids:
        subtitles_text, subtitles_text_with_duration = get_english_subtitles(video_id)
        if option != 'jump':
            subtitles.append({'subtitle_id': video_id, 'subtitle_content': subtitles_text})
        else:
            subtitles.append({'subtitle_id': video_id, 'subtitle_content': subtitles_text_with_duration})
    return subtitles

def generate_prompt(option, level, subtitles, message, **kwargs):
    language = kwargs.get('language', 'English')
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

    elif option == 'quiz':
        response_format = '''[{
            "question": "The quiz question as a string",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "The correct option exactly as it appears in the options list",
            "explanation": "A brief explanation of the correct answer"
        }]'''
        prompt = f'''Act as a tutorial instructor. Based on the video subtitles: {subtitles}, generate {message} multiple-choice questions for {level} level in JSON format: {response_format}. Each question should be clear, have 4 options, and only one correct answer. The difficulty should match the '{level}' level (beginner, intermediate, or expert). The options should not have any indicators like A, B, C, D etc. or 1, 2, 3, 4 etc so that i can shuffle the options. 
        IMPORTANT: Generate the entire response in English.'''

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
    prompt = prompt + "Don't mention these words subtitle, file, content, transcript anywhere instead use the word video."
    return response_format, prompt

def init_db():
    conn = sqlite3.connect("yt.db")
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS yt_assistant (video_id TEXT PRIMARY KEY, subtitle_with_duration TEXT, subtitle TEXT)")
    
    # Challenge table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS challenges (
            challenge_id TEXT PRIMARY KEY,
            video_id TEXT,
            video_title TEXT,
            video_thumbnail TEXT,
            level TEXT,
            question_count INTEGER,
            creator_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    try:
        cursor.execute("ALTER TABLE challenges ADD COLUMN video_title TEXT")
    except: pass
    try:
        cursor.execute("ALTER TABLE challenges ADD COLUMN video_thumbnail TEXT")
    except: pass
    
    # Leaderboard table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge_id TEXT,
            user_name TEXT,
            score INTEGER,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (challenge_id) REFERENCES challenges (challenge_id)
        )
    """)
    
    # Cached quizzes table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cached_quizzes (
            video_id TEXT,
            level TEXT,
            questions TEXT,
            fr TEXT,
            zh_cn TEXT,
            ja TEXT,
            sv TEXT,
            es TEXT,
            de TEXT,
            ta TEXT,
            hi TEXT,
            te TEXT,
            ml TEXT,
            ko TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (video_id, level)
        )
    """)
    lang_cols = ['fr', 'zh_cn', 'ja', 'sv', 'es', 'de', 'ta', 'hi', 'te', 'ml', 'ko']
    for col in lang_cols:
        try:
            cursor.execute(f"ALTER TABLE cached_quizzes ADD COLUMN {col} TEXT")
        except: pass

    # FEATURE 1: Cached study notes + mind maps
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cached_notes (
            video_id TEXT PRIMARY KEY,
            notes TEXT,
            mindmap TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    try:
        cursor.execute("ALTER TABLE cached_notes ADD COLUMN mindmap TEXT")
    except: pass

    # FEATURE 3: User learning progress / dashboard
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT,
            video_id TEXT,
            video_title TEXT,
            video_thumbnail TEXT,
            level TEXT,
            score INTEGER,
            taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # FEATURE 4: Saved playlists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS playlists (
            playlist_id TEXT PRIMARY KEY,
            name TEXT,
            videos_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

init_db()
