from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.api.dependencies import authenticate
from app.services.research_service import research
from app.llm.client import ProviderUnavailable
router = APIRouter(dependencies=[Depends(authenticate)])


class ResearchRequest(BaseModel):
    query: str = Field(min_length=5, max_length=2000)


@router.post('/research')
def run_research(request: ResearchRequest):
    try:
        return research(request.query)
    except ProviderUnavailable as error:
        raise HTTPException(503, str(error)) from error
