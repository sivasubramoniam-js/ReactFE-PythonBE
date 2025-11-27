
from youtube_transcript_api import YouTubeTranscriptApi

transcript = None
transcript_list = YouTubeTranscriptApi.list_transcripts('kUMe1FH4CHE')
print(f"Transcript List: {transcript_list}")
transcript = None
# Try to find an English transcript directly
try:
    transcript = transcript_list.find_transcript(['en'])
    transcript = transcript.fetch()
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
                print(f"Failed to translate from {transcript_list_item.language_code} to 'en'")