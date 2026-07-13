import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("GEMINI_API_KEY is not set!")
    exit(1)

genai.configure(api_key=api_key)

def test_func():
    # Closure variable
    suffix = "!!! Yay, closures work!"
    
    def search_something(query: str) -> str:
        """Search for something.
        
        Args:
            query: The search term.
        """
        print(f"[Tool Invoked] search_something with query={query}")
        return f"Found results for '{query}'" + suffix
        
    try:
        model = genai.GenerativeModel(
            model_name='gemini-2.5-flash',
            tools=[search_something]
        )
        
        chat = model.start_chat(enable_automatic_function_calling=True)
        print("Sending message to closure tool...")
        response = chat.send_message("Search for health schemes")
        print("Response:")
        print(response.text)
    except Exception as e:
        print("Error during closure tool test:", e)

test_func()
