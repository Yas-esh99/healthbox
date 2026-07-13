from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.config import get_settings
from app.models import (
    LogoutResponse,
    RegisterRequest,
    RegisterResponse,
    SendOtpRequest,
    SendOtpResponse,
    SessionResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    UpdateProfileRequest,
    UserProfile,
)
from app.repositories.users import FirestoreUserRepository
from app.services.auth import (
    create_registration_token,
    create_session_token,
    decode_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def get_user_repository(request: Request) -> FirestoreUserRepository:
    return request.app.state.user_repository


def _set_cookie(response: Response, key: str, value: str, max_age: int) -> None:
    settings = get_settings()
    response.set_cookie(
        key=key,
        value=value,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=max_age,
        path="/",
    )


def _clear_cookie(response: Response, key: str) -> None:
    response.delete_cookie(key=key, path="/", samesite="lax")


@router.post("/request-otp", response_model=SendOtpResponse)
def request_otp(payload: SendOtpRequest) -> SendOtpResponse:
    settings = get_settings()
    return SendOtpResponse(
        challenge_id=f"demo-{payload.phone_number}",
        phone_number=payload.phone_number,
        demo_otp=settings.otp_code,
        message="Demo OTP generated successfully.",
    )


@router.post("/verify-otp", response_model=VerifyOtpResponse)
def verify_otp(
    payload: VerifyOtpRequest,
    request: Request,
    response: Response,
) -> VerifyOtpResponse:
    settings = get_settings()
    if payload.otp_code != settings.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP. Use the configured demo OTP.",
        )

    repository = get_user_repository(request)
    user = repository.get_by_phone(payload.phone_number)

    if user:
        session_token = create_session_token(payload.phone_number)
        _set_cookie(
            response,
            settings.auth_cookie_name,
            session_token,
            max_age=settings.session_expire_hours * 60 * 60,
        )
        _clear_cookie(response, settings.registration_cookie_name)
        return VerifyOtpResponse(
            registered=True,
            redirect_to="/home",
            phone_number=payload.phone_number,
            user=user,
        )

    registration_token = create_registration_token(payload.phone_number)
    _set_cookie(
        response,
        settings.registration_cookie_name,
        registration_token,
        max_age=60 * 60,
    )
    _clear_cookie(response, settings.auth_cookie_name)
    return VerifyOtpResponse(
        registered=False,
        redirect_to="/register",
        phone_number=payload.phone_number,
    )


@router.post("/register", response_model=RegisterResponse)
def register_user(
    payload: RegisterRequest,
    request: Request,
    response: Response,
) -> RegisterResponse:
    settings = get_settings()
    registration_token = request.cookies.get(settings.registration_cookie_name)
    if not registration_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Registration session missing. Verify OTP first.",
        )

    pending_phone_number = decode_token(registration_token, expected_type="registration")
    if pending_phone_number != payload.phone_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number does not match verified registration session.",
        )

    repository = get_user_repository(request)
    existing_user = repository.get_by_phone(payload.phone_number)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this phone number already exists.",
        )

    user = repository.create(payload)
    session_token = create_session_token(payload.phone_number)
    _set_cookie(
        response,
        settings.auth_cookie_name,
        session_token,
        max_age=settings.session_expire_hours * 60 * 60,
    )
    _clear_cookie(response, settings.registration_cookie_name)
    return RegisterResponse(redirect_to="/home", user=user)


@router.get("/session", response_model=SessionResponse)
def get_session(request: Request) -> SessionResponse:
    settings = get_settings()
    session_token = request.cookies.get(settings.auth_cookie_name)
    if not session_token:
        return SessionResponse(authenticated=False)

    phone_number = decode_token(session_token, expected_type="session")
    repository = get_user_repository(request)
    user = repository.get_by_phone(phone_number)
    if not user:
        return SessionResponse(authenticated=False)

    return SessionResponse(authenticated=True, user=user)


@router.post("/logout", response_model=LogoutResponse)
def logout(response: Response) -> LogoutResponse:
    settings = get_settings()
    _clear_cookie(response, settings.auth_cookie_name)
    _clear_cookie(response, settings.registration_cookie_name)
    return LogoutResponse(message="Logged out successfully.")


def get_current_phone(request: Request) -> str:
    """Dependency to retrieve the authenticated user's phone number from session cookie."""
    settings = get_settings()
    session_token = request.cookies.get(settings.auth_cookie_name)
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in first.",
        )
    return decode_token(session_token, expected_type="session")


@router.put("/profile", response_model=UserProfile)
def update_profile(
    payload: UpdateProfileRequest,
    request: Request,
    response: Response,
    current_phone: str = Depends(get_current_phone),
) -> UserProfile:
    settings = get_settings()
    repository = get_user_repository(request)

    # If mobile number changed, ensure uniqueness
    if payload.mobile_number != current_phone:
        existing_user = repository.get_by_phone(payload.mobile_number)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this mobile number already exists.",
            )

        # Migrate user document
        user_profile = repository.migrate_phone(current_phone, payload)

        # Migrate associated triage records
        records_repo = request.app.state.records_repository
        records_repo.migrate_user_phone(current_phone, payload.mobile_number)

        # Re-set session token with the new phone number
        session_token = create_session_token(payload.mobile_number)
        _set_cookie(
            response,
            settings.auth_cookie_name,
            session_token,
            max_age=settings.session_expire_hours * 60 * 60,
        )
        return user_profile
    else:
        # Update user profile details
        return repository.update(current_phone, payload)

