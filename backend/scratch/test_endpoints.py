import requests

base_url = "http://localhost:8000/api/v1"

endpoints = ["hospitals", "pharmacies", "schemes"]
for endpoint in endpoints:
    url = f"{base_url}/{endpoint}"
    print(f"Fetching: {url}")
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Loaded {len(data)} items.")
            if data:
                print("First item keys:", list(data[0].keys()))
        else:
            print("Response:", response.text)
    except Exception as e:
        print(f"Error fetching {endpoint}: {e}")
