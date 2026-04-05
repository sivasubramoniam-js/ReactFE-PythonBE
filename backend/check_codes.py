from deep_translator import GoogleTranslator
translator = GoogleTranslator()
codes = ['en', 'fr', 'zh-cn', 'ja', 'sv', 'es', 'de', 'ta', 'hi', 'te', 'ml', 'ko']
supported = translator.get_supported_languages(as_dict=True)
for code in codes:
    # GoogleTranslator keys are language names (lowercase), values are codes
    # Actually, as_dict=True returns {name: code}
    found = False
    for name, c in supported.items():
        if c == code:
            print(f"Code {code} is supported as {name}")
            found = True
            break
    if not found:
        print(f"Code {code} is NOT found in exact form")
