from app.utils.jwt_handler import (
    create_access_token,
    verify_access_token
)

data = {
    "user_id": "saketh123"
}

token = create_access_token(data)

print("Generated Token:")
print(token)

print()

decoded = verify_access_token(token)

print("Decoded Payload:")
print(decoded)