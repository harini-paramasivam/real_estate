import logging

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, bookings, dashboard, leads, properties, users
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("real_estate_crm")

app = FastAPI(
    title="Real Estate CRM API",
    description="Lead management, property inventory, and booking API for a real estate sales team.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # exc.errors() can contain non-JSON-native values (e.g. Decimal from
    # numeric constraints, bytes, etc). jsonable_encoder converts these to
    # JSON-safe primitives without weakening or altering the validation
    # itself -- the errors and status code are unchanged.
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": jsonable_encoder(exc.errors())},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Never leak stack traces to the client; log full detail server-side.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(leads.router)
app.include_router(properties.router)
app.include_router(bookings.router)
app.include_router(dashboard.router)


@app.get("/api/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
