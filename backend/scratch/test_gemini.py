import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"Loaded API key: {api_key[:8]}...{api_key[-4:] if api_key else ''}")

if not api_key:
    print("Error: GEMINI_API_KEY is not set!")
    exit(1)

genai.configure(api_key=api_key)

try:
    print("Listing models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f" - {m.name}")
            
    print("\nTesting generation with gemini-3.5-flash...")
    model = genai.GenerativeModel('gemini-3.5-flash')
    response = model.generate_content("Hello! Say hi.")
    print("Response:", response.text)
except Exception as e:
    print("Error occurred during test:", e)
