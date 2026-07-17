import requests

url = "http://localhost:8000/api/v1/reports/analyze"
file_path = "scratch/mock_report.png"

try:
    with open(file_path, "rb") as f:
        files = {"file": ("mock_report.png", f, "image/png")}
        print("Sending POST request to /api/v1/reports/analyze...")
        response = requests.post(url, files=files)
        print("Response status:", response.status_code)
        print("Response JSON:", response.json())
except Exception as e:
    print("Error sending request:", e)
