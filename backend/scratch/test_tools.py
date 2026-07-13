import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("GEMINI_API_KEY is not set!")
    exit(1)

genai.configure(api_key=api_key)

# Define a mock tool
def get_current_weather(location: str) -> str:
    """Get the current weather for a location.
    
    Args:
        location: The city and state, e.g. San Francisco, CA
    """
    print(f"[Tool Invoked] get_current_weather with location={location}")
    return f"The weather in {location} is sunny and 72 degrees."

try:
    # Use gemini-2.5-flash as it is fast and supports tool calling
    model = genai.GenerativeModel(
        model_name='gemini-2.5-flash',
        tools=[get_current_weather]
    )
    
    chat = model.start_chat(enable_automatic_function_calling=True)
    print("Sending message...")
    response = chat.send_message("What's the weather like in Boston?")
    print("Response:")
    print(response.text)
    print("Chat history:")
    for turn in chat.history:
        print(f"Role: {turn.role}")
        print(f"Parts: {turn.parts}")
except Exception as e:
    print("Error during tool test:", e)
