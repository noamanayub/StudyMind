from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import authenticate
from app.schemas.study import StudyRequest
from app.services.study_service import generate_study, InsufficientMaterial
from app.llm.client import ProviderUnavailable

router = APIRouter(dependencies=[Depends(authenticate)])


@router.post('/study/generate')
def study(request: StudyRequest):
    if (request.scope == 'workspace' and not request.workspaceId) or (request.scope == 'documents' and not request.documentIds):
        raise HTTPException(422, 'Choose your study material.')
    try:
        return generate_study(request)
    except InsufficientMaterial as error:
        raise HTTPException(422, str(error)) from error
    except ProviderUnavailable as error:
        raise HTTPException(503, str(error)) from error
