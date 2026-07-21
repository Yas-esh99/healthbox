from fastapi import APIRouter, Request, Depends
from app.models import Pharmacy
from app.routers.records import get_current_phone

router = APIRouter(prefix="/pharmacies", tags=["pharmacies"])

@router.get("", response_model=list[Pharmacy])
def get_pharmacies(
    request: Request,
    phone_number: str = Depends(get_current_phone)
) -> list[Pharmacy]:
    repository = request.app.state.pharmacies_repository
    return repository.get_all()
