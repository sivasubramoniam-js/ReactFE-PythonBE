from textblob import Word
from googletrans import Translator

translator = Translator()

def get_meaning(word):
    word_lang = translator.detect(word)
    if word_lang.lang != 'en':
        word = translator.translate(word, dest='en').text
        word_meaning = Word(word)
        word_definitions_in_source_lang = [ translator.translate(definition, dest=word_lang.lang).text for definition in word_meaning.definitions ]
        return word_definitions_in_source_lang
    word_meaning = Word(word)
    return word_meaning.definitions

def detect_language(text):
    blob = translator.detect(text)
    return blob.lang

if __name__ == "__main__":
    word = "பணம்"
    print(get_meaning(word))
    print(detect_language(word))