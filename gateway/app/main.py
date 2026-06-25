from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.middleware.auth import AuthMiddleware
from app.middleware.audit import AuditMiddleware

app = FastAPI(
    title="Medical AI Platform Gateway",
    description="Central routing, security, and auditing entry point.",
    version="1.0.0"
)

# CORS Middleware Configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register security and logging middlewares
# AuthMiddleware runs inside AuditMiddleware
app.add_middleware(AuthMiddleware)
app.add_middleware(AuditMiddleware)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/v1/public/test")
def public_test():
    return {
        "message": "This is a public endpoint.",
        "user_id": None,
        "role": "Guest"
    }

@app.get("/api/v1/protected-test")
def protected_test(request: Request):
    return {
        "message": "This is a secure protected endpoint.",
        "user_id": request.state.user_id,
        "role": request.state.role
    }
