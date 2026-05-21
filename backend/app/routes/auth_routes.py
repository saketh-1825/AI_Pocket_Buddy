from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.schemas.user_schema import UserLogin

from app.utils.hashing import verify_password

from app.utils.jwt_handler import create_access_token
from app.database import db

from app.schemas.user_schema import (
    UserRegister
)

from app.models.user_model import (
    USER_COLLECTION
)

from app.utils.hashing import (
    hash_password
)

router = APIRouter()


@router.post("/register")
async def register_user(user: UserRegister):

    existing_user = await db[
        USER_COLLECTION
    ].find_one({
        "email": user.email
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_pw = hash_password(
        user.password
    )

    new_user = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed_pw,
        "created_at": datetime.utcnow()
    }

    result = await db[
        USER_COLLECTION
    ].insert_one(new_user)

    access_token = create_access_token(
        data={
            "user_id": str(result.inserted_id)
        }
    )

    return {
        "message": "User registered successfully",
        "access_token": access_token
    }

@router.post("/login")
async def login_user(user: UserLogin):

    existing_user = await db[
        USER_COLLECTION
    ].find_one({
        "email": user.email
    })

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    is_password_correct = verify_password(
        user.password,
        existing_user["hashed_password"]
    )

    if not is_password_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    access_token = create_access_token(
        data={
            "user_id": str(existing_user["_id"])
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token
    }