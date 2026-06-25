import time
import json
import logging
from datetime import datetime, timezone
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("gateway.audit")
logger.setLevel(logging.INFO)

# Structured console log stream setup
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(message)s"))
logger.addHandler(handler)
logger.propagate = False

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Proceed downstream
        response = await call_next(request)
        
        duration = time.time() - start_time
        
        # Safely extract auth context attributes
        user_id = getattr(request.state, "user_id", None)
        role = getattr(request.state, "role", "Guest")
        
        audit_payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "ip_address": request.client.host if request.client else "unknown",
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_seconds": round(duration, 4),
            "user_id": user_id,
            "role": role
        }
        
        logger.info(json.dumps(audit_payload))
        return response
