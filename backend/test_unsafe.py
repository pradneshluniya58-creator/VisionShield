import requests

unsafe_payload = {
    "sanitized_dom": [
        {
            "type": "EMAIL",
            "token": "rahul@example.com"
        },
        {
            "type": "PHONE",
            "token": "9876543210"
        },
        {
            "type": "GOV_ID",
            "token": "ABCDE1234F"
        }
    ]
}

response = requests.post(
    "http://127.0.0.1:5000/receive-sanitized",
    json=unsafe_payload
)

print(response.json())