import asyncio

import socketio
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import create_pool, close_pool
from app.routes.game import router as game_router
from app.routes.profiles import router as profiles_router
from app.routes.realms import router as realms_router
from app.session import session_manager
from app.sockets.handlers import register_handlers
from app.sockets.helpers import kick_player, set_sio

# --- FastAPI app ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(realms_router)
app.include_router(profiles_router)
app.include_router(game_router)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse({"message": str(exc)}, status_code=500)


@app.on_event("startup")
async def startup():
    await create_pool()


@app.on_event("shutdown")
async def shutdown():
    await close_pool()


# --- Socket.IO server ---
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[settings.FRONTEND_URL],
)

# Inject sio into helpers and session manager
set_sio(sio)


# Wrap kick_player for synchronous calling context from session_manager.terminate_session
def _sync_kick_wrapper(uid: str, reason: str) -> None:
    """Schedule async kick_player on the running event loop."""
    loop = asyncio.get_event_loop()
    if loop.is_running():
        loop.create_task(kick_player(uid, reason))
    else:
        loop.run_until_complete(kick_player(uid, reason))


session_manager.set_kick_fn(_sync_kick_wrapper)

register_handlers(sio)

# --- Combined ASGI app ---
combined_app = socketio.ASGIApp(sio, other_asgi_app=app)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:combined_app",
        host="0.0.0.0",
        port=settings.PORT,
        workers=1,
    )
