from fastapi import APIRouter, Request, Depends
from app.models import Hospital
from app.routers.records import get_current_phone

router = APIRouter(prefix="/hospitals", tags=["hospitals"])

@router.get("", response_model=list[Hospital])
def get_hospitals(
    request: Request,
    phone_number: str = Depends(get_current_phone)
) -> list[Hospital]:
    repository = request.app.state.hospitals_repository
    return repository.get_all()
