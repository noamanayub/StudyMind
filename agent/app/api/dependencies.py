import secrets
from fastapi import Header, HTTPException
from app.core.config import settings


def authenticate(x_agent_secret: str = Header(default='')):
    if not secrets.compare_digest(x_agent_secret, settings.agent_secret):
        raise HTTPException(401, 'Unauthorized service request.')
