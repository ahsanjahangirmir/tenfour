import jwt
from django.conf import settings
from jwt import PyJWKClient
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import User

_jwks_client = None


def _get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        if not settings.CLERK_JWKS_URL:
            raise AuthenticationFailed("CLERK_JWKS_URL is not configured")
        _jwks_client = PyJWKClient(settings.CLERK_JWKS_URL)
    return _jwks_client


class ClerkJWTAuthentication(BaseAuthentication):
    """Verifies the `Authorization: Bearer <clerk-jwt>` header against
    Clerk's JWKS, per docs/spec.md section 3 ("Auth -- verifies against
    JWKS --> Clerk"). On first sight of a given Clerk user, lazily creates
    the matching core.User row so the rest of the app has something to
    attach trips and profile data to.
    """

    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith(f"{self.keyword} "):
            return None

        token = auth_header[len(self.keyword) + 1 :].strip()
        if not token:
            return None

        try:
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=settings.CLERK_ISSUER or None,
                options={
                    "verify_aud": False,
                    "verify_iss": bool(settings.CLERK_ISSUER),
                },
            )
        except jwt.PyJWTError as exc:
            raise AuthenticationFailed(f"Invalid or expired token: {exc}") from exc

        clerk_user_id = payload.get("sub")
        if not clerk_user_id:
            raise AuthenticationFailed("Token is missing a subject claim")

        user, _ = User.objects.get_or_create(
            clerk_user_id=clerk_user_id,
            defaults={
                "email": payload.get("email", "") or "",
                "first_name": payload.get("first_name", "") or "",
                "last_name": payload.get("last_name", "") or "",
            },
        )
        return (user, token)

    def authenticate_header(self, request):
        return self.keyword
