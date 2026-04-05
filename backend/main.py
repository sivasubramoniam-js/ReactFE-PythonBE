import google.generativeai as genai
from flask_cors import CORS
from flask import Flask, jsonify, request, render_template
from yt import search_youtube, get_subtitles_for_videos, generate_prompt
import json
from dotenv import load_dotenv
import os
import random
from datetime import datetime, timedelta
from deep_translator import GoogleTranslator

app = Flask(__name__, template_folder='../frontend/build', static_folder='../frontend/build/static')
CORS(app)

@app.after_request
def log_request_response(response):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    method = request.method
    path = request.path
    url = request.url
    try:
        if request.is_json:
            payload = json.dumps(request.get_json(silent=True))
        else:
            payload = request.get_data(as_text=True)
    except Exception:
        payload = "Error reading payload"
    if method == 'GET' and request.args:
        payload = f"Query Params: {json.dumps(request.args.to_dict())}"
    try:
        response_body = response.get_data(as_text=True)
    except Exception:
        response_body = "Error reading response body"
    log_entry = (
        f"==================================================\n"
        f"Timestamp       : {timestamp}\n"
        f"Request         : {method} {path}\n"
        f"Full URL        : {url}\n"
        f"Payload         : {payload if payload else 'None'}\n"
        f"Response Status : {response.status_code}\n"
        f"Response Body   : {response_body}\n"
        f"==================================================\n\n"
    )
    log_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "api_logs.txt")
    try:
        with open(log_file_path, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception as e:
        print(f"Failed to write to log file: {e}")
    return response

load_dotenv()

genai.configure(api_key=os.getenv("API_KEY"))
generation_config = genai.types.GenerationConfig(
    max_output_tokens=None,
    temperature=1.0,
)
text_model = genai.GenerativeModel('gemini-2.5-flash', generation_config=generation_config)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/searchVideo', methods=['GET'])
def get_videos():
    keyword = request.args.get('keyword', default='', type=str)
    results = search_youtube(keyword)
    return jsonify({"result": results})

import uuid
import sqlite3

LANG_MAP = {
    'English': {'col': 'questions', 'code': 'en'},
    'French': {'col': 'fr', 'code': 'fr'},
    'Chinese': {'col': 'zh_cn', 'code': 'zh-cn'},
    'Japanese': {'col': 'ja', 'code': 'ja'},
    'Swedish': {'col': 'sv', 'code': 'sv'},
    'Spanish': {'col': 'es', 'code': 'es'},
    'German': {'col': 'de', 'code': 'de'},
    'Tamil': {'col': 'ta', 'code': 'ta'},
    'Hindi': {'col': 'hi', 'code': 'hi'},
    'Telugu': {'col': 'te', 'code': 'te'},
    'Malayalam': {'col': 'ml', 'code': 'ml'},
    'Korean': {'col': 'ko', 'code': 'ko'}
}

def translate_content(content, target_language_name):
    lang_info = LANG_MAP.get(target_language_name)
    if not lang_info or target_language_name == 'English':
        return content
    target_code = lang_info['code']
    try:
        strings_to_translate = []
        def collect_strings(obj):
            if isinstance(obj, list):
                for item in obj: collect_strings(item)
            elif isinstance(obj, dict):
                for key in ['question', 'explanation', 'answer', 'topic', 'response']:
                    if key in obj and isinstance(obj[key], str):
                        strings_to_translate.append(obj[key])
                if 'options' in obj and isinstance(obj['options'], list):
                    for opt in obj['options']:
                        if isinstance(opt, str): strings_to_translate.append(opt)
        collect_strings(content)
        if not strings_to_translate:
            return content
        translated_texts = []
        translator = GoogleTranslator(source='auto', target=target_code)
        for i, text in enumerate(strings_to_translate):
            try:
                if text.strip():
                    translated = translator.translate(text)
                    translated_texts.append(translated)
                else:
                    translated_texts.append(text)
            except Exception as e:
                print(f"String translation error at index {i}: {e}")
                return None
        text_ptr = 0
        def apply_translations(obj):
            nonlocal text_ptr
            if isinstance(obj, list):
                new_list = []
                for item in obj:
                    new_list.append(apply_translations(item))
                return new_list
            elif isinstance(obj, dict):
                new_dict = obj.copy()
                for key in ['question', 'explanation', 'answer', 'topic', 'response']:
                    if key in new_dict and isinstance(new_dict[key], str):
                        if text_ptr < len(translated_texts):
                            new_dict[key] = translated_texts[text_ptr]
                            text_ptr += 1
                if 'options' in new_dict and isinstance(new_dict['options'], list):
                    new_options = []
                    for opt in new_dict['options']:
                        if isinstance(opt, str):
                            if text_ptr < len(translated_texts):
                                new_options.append(translated_texts[text_ptr])
                                text_ptr += 1
                            else:
                                new_options.append(opt)
                        else:
                            new_options.append(opt)
                    new_dict['options'] = new_options
                return new_dict
            return obj
        result = apply_translations(content)
        return result
    except Exception as e:
        print(f"Critical translation error: {e}")
        return None

@app.route('/generateQuiz', methods=["POST"])
def generate_quiz():
    data = request.get_json()
    video_ids = data.get("id")
    video_id = video_ids[0] if isinstance(video_ids, list) and len(video_ids) > 0 else video_ids
    level = data.get("level", "beginner")
    num_questions = data.get("num_questions", 10)
    language_name = data.get("language", "English")
    lang_info = LANG_MAP.get(language_name, LANG_MAP['English'])
    target_col = lang_info['col']

    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        query = f"SELECT questions, {target_col} FROM cached_quizzes WHERE video_id = ? AND level = ?"
        cursor.execute(query, (video_id, level))
        row = cursor.fetchone()
        english_data = None
        target_data = None
        if row:
            english_data = json.loads(row[0]) if row[0] else None
            target_data = json.loads(row[1]) if row[1] else None
        if not english_data:
            subtitles = get_subtitles_for_videos([video_id], 'chat')
            if not subtitles or not subtitles[0].get('subtitle_content'):
                return jsonify({'error': "Can't use this video: No subtitles available and audio transcription failed."}), 400
            response_format, prompt = generate_prompt('quiz', level, subtitles, "25")
            model_resp = text_model.generate_content(prompt)
            response_text = model_resp.text
            try:
                start_index = response_text.find('[')
                end_index = response_text.rfind(']')
                if start_index != -1 and end_index != -1:
                    clean_json = response_text[start_index:end_index+1]
                    english_data = json.loads(clean_json)
            except Exception as e:
                print(f"Error parsing quiz JSON: {e}")
            if english_data:
                cursor.execute("INSERT OR REPLACE INTO cached_quizzes (video_id, level, questions) VALUES (?, ?, ?)",
                            (video_id, level, json.dumps(english_data)))
                conn.commit()
        if english_data and not target_data and language_name != 'English':
            target_data = translate_content(english_data, language_name)
            if target_data:
                cursor.execute(f"UPDATE cached_quizzes SET {target_col} = ? WHERE video_id = ? AND level = ?",
                               (json.dumps(target_data), video_id, level))
                conn.commit()
        final_data = target_data if language_name != 'English' else english_data
        if final_data:
            conn.close()
            random.shuffle(final_data)
            quiz_subset = final_data[:num_questions]
            stripped_quiz = []
            for q in quiz_subset:
                stripped_q = q.copy()
                stripped_q.pop('answer', None)
                stripped_q.pop('explanation', None)
                stripped_quiz.append(stripped_q)
            return jsonify({'quiz': stripped_quiz, 'video_id': video_id, 'level': level, 'language': language_name})
        else:
            if 'conn' in locals() and conn: conn.close()
            return jsonify({'error': 'Failed to extract valid quiz data'}), 500
    except Exception as e:
        if 'conn' in locals() and conn: conn.close()
        print(f"Error in generate_quiz: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/validateQuiz', methods=["POST"])
def validate_quiz():
    data = request.get_json()
    video_id = data.get("video_id")
    level = data.get("level")
    language_name = data.get("language", "English")
    user_answers = data.get("answers")
    received_questions = data.get("questions")
    lang_info = LANG_MAP.get(language_name, LANG_MAP['English'])
    target_col = lang_info['col']

    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("SELECT " + target_col + " FROM cached_quizzes WHERE video_id = ? AND level = ?", (video_id, level))
        row = cursor.fetchone()
        conn.close()
        if not row or not row[0]:
            return jsonify({'error': 'Quiz data not found for validation'}), 404
        all_questions = json.loads(row[0])
        results = []
        correct_count = 0
        for i, q_sent in enumerate(received_questions):
            full_q = next((item for item in all_questions if item["question"] == q_sent["question"]), None)
            user_ans = user_answers.get(str(i))
            is_correct = False
            if full_q:
                is_correct = (user_ans == full_q["answer"])
                if is_correct:
                    correct_count += 1
                results.append({
                    "question": full_q["question"],
                    "options": full_q["options"],
                    "answer": full_q["answer"],
                    "explanation": full_q["explanation"],
                    "user_answer": user_ans,
                    "is_correct": is_correct
                })
            else:
                results.append({
                    "question": q_sent["question"],
                    "error": "Question not found in cache"
                })
        score = round((correct_count / len(received_questions)) * 100) if received_questions else 0
        return jsonify({
            'score': score,
            'results': results,
            'correct_count': correct_count,
            'total_count': len(received_questions)
        })
    except Exception as e:
        print(f"Validation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/createChallenge', methods=["POST"])
def create_challenge():
    data = request.get_json()
    video_id = data.get("video_id")
    level = data.get("level")
    num_questions = data.get("num_questions")
    creator_name = data.get("creator_name", "Anonymous")
    challenge_id = str(uuid.uuid4())[:8]
    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO challenges (challenge_id, video_id, video_title, video_thumbnail, level, question_count, creator_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (challenge_id, video_id, data.get("video_title"), data.get("video_thumbnail"), level, num_questions, creator_name))
        conn.commit()
        conn.close()
        return jsonify({'challenge_id': challenge_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/getChallenge/<challenge_id>', methods=["GET"])
def get_challenge(challenge_id):
    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM challenges WHERE challenge_id = ?", (challenge_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            columns = ["challenge_id", "video_id", "level", "question_count", "creator_name", "created_at", "video_title", "video_thumbnail"]
            challenge_data = dict(zip(columns, row))
            try:
                created_at = datetime.strptime(challenge_data['created_at'], '%Y-%m-%d %H:%M:%S')
                if datetime.utcnow() > created_at + timedelta(hours=24):
                    return jsonify({'error': 'Challenge expired'}), 410
            except Exception as te:
                print(f"Time parsing error: {te}")
                pass
            try:
                conn = sqlite3.connect("yt.db")
                cursor_attempts = conn.cursor()
                cursor_attempts.execute("""
                    SELECT COUNT(*) FROM leaderboard 
                    WHERE challenge_id IN (SELECT challenge_id FROM challenges WHERE video_id = ?)
                """, (challenge_data['video_id'],))
                challenge_data['total_video_attempts'] = cursor_attempts.fetchone()[0]
                conn.close()
            except:
                challenge_data['total_video_attempts'] = 0
            return jsonify(challenge_data)
        return jsonify({'error': 'Challenge not found'}), 404
    except Exception as e:
        print(f"Error in get_challenge: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/submitScore', methods=["POST"])
def submit_score():
    data = request.get_json()
    challenge_id = data.get("challenge_id")
    user_name = data.get("user_name")
    score = data.get("score")
    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO leaderboard (challenge_id, user_name, score)
            VALUES (?, ?, ?)
        """, (challenge_id, user_name, score))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/getLeaderboard/<challenge_id>', methods=["GET"])
def get_leaderboard(challenge_id):
    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT user_name, score, completed_at FROM leaderboard 
            WHERE challenge_id = ? 
            ORDER BY score DESC, completed_at ASC
        """, (challenge_id,))
        rows = cursor.fetchall()
        conn.close()
        leaderboard = []
        for row in rows:
            leaderboard.append({
                'user_name': row[0],
                'score': row[1],
                'completed_at': row[2]
            })
        return jsonify({'leaderboard': leaderboard})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=["POST"])
def chat():
    data = request.get_json()
    option = data.get("option")
    message = data.get("message")
    video_ids = data.get("id")
    subtitles = get_subtitles_for_videos(video_ids, option)
    if all(not s.get('subtitle_content') for s in subtitles):
        return jsonify({'response': [{"id": video_ids, "content": "Can't use this video: No subtitles available and audio transcription failed.", "json": False}]})
    try:
        response_format, prompt = generate_prompt(option, 'beginner', subtitles, message)
        model_resp = text_model.generate_content(prompt)
        response_text = clean_response_text(model_resp.text)
        isJsonResponse = check_json(response_text)
        subtitle_list = [{"id": video_ids, "content": response_text, "json": isJsonResponse}]
        return jsonify({'response': subtitle_list})
    except Exception as e:
        print(e)
        subtitle_list = [{"id": video_ids, "content": 'This video has some harmful content. Please choose a different video.'}]
        return jsonify({'response': subtitle_list})

# ─────────────────────────────────────────────────────────────────────────────
# FEATURE 1: AI Study Notes Generator
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/generateNotes', methods=["POST"])
def generate_notes():
    data = request.get_json()
    video_ids = data.get("id")
    video_id = video_ids[0] if isinstance(video_ids, list) else video_ids

    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("SELECT notes FROM cached_notes WHERE video_id = ?", (video_id,))
        row = cursor.fetchone()
        conn.close()

        if row and row[0]:
            return jsonify({'notes': json.loads(row[0])})

        subtitles = get_subtitles_for_videos([video_id], 'chat')
        if not subtitles or not subtitles[0].get('subtitle_content'):
            return jsonify({'error': "No subtitles available for this video."}), 400

        prompt = f"""You are an expert educator. Based on the following video subtitles: {subtitles[0]['subtitle_content'][:8000]}

Generate structured study notes in the following JSON format:
{{
  "tldr": "A 2-3 sentence TL;DR summary of the entire video",
  "key_concepts": ["concept 1", "concept 2", "concept 3", "...up to 8 key concepts"],
  "sections": [
    {{
      "heading": "Section Title",
      "bullets": ["Point 1", "Point 2", "Point 3"]
    }}
  ],
  "takeaways": ["Actionable takeaway 1", "Actionable takeaway 2", "Actionable takeaway 3"]
}}

Return ONLY the JSON, no markdown fences."""

        model_resp = text_model.generate_content(prompt)
        response_text = model_resp.text.strip().replace("```json", "").replace("```", "").strip()

        try:
            notes_data = json.loads(response_text)
        except:
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                notes_data = json.loads(response_text[start:end+1])
            else:
                return jsonify({'error': 'Failed to parse notes from AI response'}), 500

        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO cached_notes (video_id, notes) VALUES (?, ?)",
                       (video_id, json.dumps(notes_data)))
        conn.commit()
        conn.close()

        return jsonify({'notes': notes_data})

    except Exception as e:
        print(f"Error in generate_notes: {e}")
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# FEATURE 3: Personal Learning Dashboard
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/recordProgress', methods=["POST"])
def record_progress():
    data = request.get_json()
    user_name = data.get("user_name", "Anonymous")
    video_id = data.get("video_id")
    video_title = data.get("video_title", "")
    video_thumbnail = data.get("video_thumbnail", "")
    level = data.get("level", "beginner")
    score = data.get("score", 0)

    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_progress (user_name, video_id, video_title, video_thumbnail, level, score)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_name, video_id, video_title, video_thumbnail, level, score))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/getUserProgress', methods=["GET"])
def get_user_progress():
    user_name = request.args.get('user', default='', type=str)
    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        if user_name:
            cursor.execute("""
                SELECT video_id, video_title, video_thumbnail, level, score, taken_at
                FROM user_progress WHERE user_name = ?
                ORDER BY taken_at DESC
            """, (user_name,))
        else:
            cursor.execute("""
                SELECT video_id, video_title, video_thumbnail, level, score, taken_at
                FROM user_progress
                ORDER BY taken_at DESC LIMIT 50
            """)
        rows = cursor.fetchall()

        # Get all-time stats
        cursor.execute("SELECT AVG(score), MAX(score), COUNT(*) FROM user_progress WHERE user_name = ?", (user_name,))
        stats_row = cursor.fetchone()
        conn.close()

        progress = []
        for row in rows:
            progress.append({
                'video_id': row[0],
                'video_title': row[1],
                'video_thumbnail': row[2],
                'level': row[3],
                'score': row[4],
                'taken_at': row[5]
            })

        stats = {
            'avg_score': round(stats_row[0] or 0, 1),
            'best_score': stats_row[1] or 0,
            'total_quizzes': stats_row[2] or 0
        }

        return jsonify({'progress': progress, 'stats': stats})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# FEATURE 4: Playlist Persistence
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/createPlaylist', methods=["POST"])
def create_playlist():
    data = request.get_json()
    name = data.get("name", "My Playlist")
    videos = data.get("videos", [])
    playlist_id = str(uuid.uuid4())[:8]
    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO playlists (playlist_id, name, videos_json) VALUES (?, ?, ?)",
                       (playlist_id, name, json.dumps(videos)))
        conn.commit()
        conn.close()
        return jsonify({'playlist_id': playlist_id, 'name': name})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/getPlaylists', methods=["GET"])
def get_playlists():
    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("SELECT playlist_id, name, videos_json, created_at FROM playlists ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        playlists = []
        for row in rows:
            playlists.append({
                'playlist_id': row[0],
                'name': row[1],
                'videos': json.loads(row[2]) if row[2] else [],
                'created_at': row[3]
            })
        return jsonify({'playlists': playlists})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/deletePlaylist/<playlist_id>', methods=["DELETE"])
def delete_playlist(playlist_id):
    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("DELETE FROM playlists WHERE playlist_id = ?", (playlist_id,))
        conn.commit()
        conn.close()
        return jsonify({'status': 'deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# FEATURE 5 & 6: AI Comparison Matrix + Mind Map
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/compareVideos', methods=["POST"])
def compare_videos():
    data = request.get_json()
    video_ids = data.get("ids", [])
    if len(video_ids) < 2:
        return jsonify({'error': 'Please add at least 2 videos to compare'}), 400

    try:
        subtitles = get_subtitles_for_videos(video_ids, 'chat')
        if all(not s.get('subtitle_content') for s in subtitles):
            return jsonify({'error': 'No subtitles available for these videos.'}), 400

        # Truncate for prompt size
        truncated = []
        for s in subtitles:
            truncated.append({'subtitle_id': s['subtitle_id'], 'subtitle_content': (s.get('subtitle_content') or '')[:3000]})

        prompt = f"""You are an expert video analyst. Compare these YouTube video transcripts: {truncated}

Return a structured JSON comparison:
{{
  "videos": [
    {{
      "id": "video_id",
      "topics": ["topic1", "topic2", "topic3"],
      "depth": "shallow|moderate|deep",
      "pace": "slow|medium|fast",
      "audience": "beginner|intermediate|advanced",
      "style": "theoretical|practical|mixed",
      "pros": ["pro1", "pro2"],
      "cons": ["con1", "con2"]
    }}
  ],
  "recommendation": "Which video to watch first and why, in 2-3 sentences.",
  "common_topics": ["topic shared across all videos"],
  "unique_to_each": {{"video_id": ["unique topic1", "unique topic2"]}}
}}

Return ONLY the JSON, no markdown fences."""

        model_resp = text_model.generate_content(prompt)
        response_text = model_resp.text.strip().replace("```json", "").replace("```", "").strip()

        try:
            comparison = json.loads(response_text)
        except:
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                comparison = json.loads(response_text[start:end+1])
            else:
                return jsonify({'error': 'Failed to parse comparison from AI'}), 500

        return jsonify({'comparison': comparison})
    except Exception as e:
        print(f"Error in compare_videos: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/generateMindMap', methods=["POST"])
def generate_mind_map():
    data = request.get_json()
    video_ids = data.get("id")
    video_id = video_ids[0] if isinstance(video_ids, list) else video_ids

    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("SELECT mindmap FROM cached_notes WHERE video_id = ?", (video_id,))
        row = cursor.fetchone()
        conn.close()
        if row and row[0]:
            return jsonify({'mindmap': json.loads(row[0])})

        subtitles = get_subtitles_for_videos([video_id], 'jump')
        if not subtitles or not subtitles[0].get('subtitle_content'):
            return jsonify({'error': 'No subtitles available'}), 400

        prompt = f"""Analyze the following video transcript (with timestamps): {subtitles[0]['subtitle_content'][:6000]}

Generate a hierarchical mind map in JSON format:
{{
  "root": "Main Topic of Video",
  "children": [
    {{
      "topic": "Major Concept 1",
      "start": "HH:MM:SS",
      "children": [
        {{"topic": "Sub-concept 1a", "start": "HH:MM:SS", "children": []}},
        {{"topic": "Sub-concept 1b", "start": "HH:MM:SS", "children": []}}
      ]
    }},
    {{
      "topic": "Major Concept 2",
      "start": "HH:MM:SS",
      "children": []
    }}
  ]
}}

Include 3-6 major concepts, each with 2-4 sub-concepts where relevant. Use timestamps from the transcript.
Return ONLY the JSON, no markdown fences."""

        model_resp = text_model.generate_content(prompt)
        response_text = model_resp.text.strip().replace("```json", "").replace("```", "").strip()

        try:
            mindmap = json.loads(response_text)
        except:
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                mindmap = json.loads(response_text[start:end+1])
            else:
                return jsonify({'error': 'Failed to parse mind map from AI'}), 500

        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("UPDATE cached_notes SET mindmap = ? WHERE video_id = ?",
                       (json.dumps(mindmap), video_id))
        if cursor.rowcount == 0:
            cursor.execute("INSERT INTO cached_notes (video_id, mindmap) VALUES (?, ?)",
                           (video_id, json.dumps(mindmap)))
        conn.commit()
        conn.close()

        return jsonify({'mindmap': mindmap})
    except Exception as e:
        print(f"Error in generate_mind_map: {e}")
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# FEATURE 8: Subtitle Full-Text Search
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/searchSubtitles', methods=["GET"])
def search_subtitles():
    query = request.args.get('q', default='', type=str)
    if not query or len(query) < 2:
        return jsonify({'results': []})

    try:
        conn = sqlite3.connect("yt.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ya.video_id, ya.subtitle_with_duration
            FROM yt_assistant ya
            WHERE ya.subtitle LIKE ?
            LIMIT 20
        """, (f'%{query}%',))
        rows = cursor.fetchall()
        conn.close()

        results = []
        for row in rows:
            video_id = row[0]
            subtitle_with_duration = row[1] or ""

            # Find matching lines with timestamps
            matching_segments = []
            for line in subtitle_with_duration.split('\n'):
                if query.lower() in line.lower() and line.strip():
                    matching_segments.append(line.strip())
                    if len(matching_segments) >= 3:
                        break

            results.append({
                'video_id': video_id,
                'thumbnail': f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                'url': f"https://www.youtube.com/watch?v={video_id}",
                'matching_segments': matching_segments
            })

        return jsonify({'results': results, 'query': query})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def check_json(text):
    response = text.replace("json", "").replace("```", "")
    if isinstance(response, str):
        try:
            parsed = json.loads(response)
            if isinstance(parsed, (dict, list)):
                return parsed
            else:
                return False
        except json.JSONDecodeError:
            return False
    else:
        return False

def clean_response_text(text):
    return text.replace("json", "").replace("```", "")

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
