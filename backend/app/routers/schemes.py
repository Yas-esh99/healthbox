from fastapi import APIRouter, Request, Depends
from app.models import Scheme
from app.routers.records import get_current_phone

router = APIRouter(prefix="/schemes", tags=["schemes"])

@router.get("", response_model=list[Scheme])
def get_schemes(
    request: Request,
    phone_number: str = Depends(get_current_phone)
) -> list[Scheme]:
    repository = request.app.state.schemes_repository
    return repository.get_all()
