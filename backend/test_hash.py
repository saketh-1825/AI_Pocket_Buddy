from app.utils.hashing import (
    hash_password,
    verify_password
)

password = "saketh123"

hashed = hash_password(password)

print("Hashed Password:")
print(hashed)

print()

is_correct = verify_password(
    "saketh123",
    hashed
)

print("Password Match:", is_correct)