import requests


payload = {
    "task": "Review this application and submit it.",

    "sanitized_dom": [
        {
            "type": "NAME",
            "token": "[NAME_1]"
        },
        {
            "type": "EMAIL",
            "token": "[EMAIL_2]"
        },
        {
            "type": "PHONE",
            "token": "[PHONE_3]"
        },
        {
            "type": "GOV_ID",
            "token": "[GOV_ID_4]"
        },
        {
            "type": "PASSWORD",
            "token": "[PASSWORD_5]"
        }
    ]
}


response = requests.post(
    "http://127.0.0.1:5000/agent",
    json=payload
)

print(response.json())