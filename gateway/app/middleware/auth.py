import jwt
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings

# Path prefixes that do not require JWT validation
UNPROTECTED_PREFIXES = [
    "/health",
    "/docs",
    "/openapi.json",
    "/api/v1/public",  # Public doctors search endpoints
]

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Exclude unprotected routes
        if any(path.startswith(prefix) for prefix in UNPROTECTED_PREFIXES):
            request.state.user_id = None
            request.state.role = "Guest"
            return await call_next(request)

        # Extract Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Missing or invalid authorization credentials."}
            )

        token = auth_header.split(" ")[1]
        try:
            # Decode the JWT token
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            request.state.user_id = payload.get("user_id")
            request.state.role = payload.get("role", "Patient")
            if not request.state.user_id:
                raise jwt.InvalidTokenError()
        except jwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Session token has expired."}
            )
        except jwt.InvalidTokenError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid session credentials."}
            )

        # Proceed to the endpoint
        response = await call_next(request)
        return response
