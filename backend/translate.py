from googletrans import Translator, LANGUAGES

def translate_text(text, dest_language):
    translator = Translator()
    translation = translator.translate(text, dest=dest_language)
    return translation.text

if __name__ == "__main__":
    text_to_translate = "Hello, how are you?"
    destination_language = "ta"  # Spanish
    translated_text = translate_text(text_to_translate, destination_language)
    print(f"Translated text: {translated_text}")
    for item in LANGUAGES.items():
        print(item)