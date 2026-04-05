from deep_translator import GoogleTranslator
try:
    translated = GoogleTranslator(source='auto', target='hi').translate("Hello world")
    print(f"Result: {translated}")
except Exception as e:
    print(f"Error: {e}")
