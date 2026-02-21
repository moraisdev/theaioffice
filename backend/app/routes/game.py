from typing import List, Optional

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.session import session_manager

router = APIRouter()


@router.get("/getPlayersInRoom")
async def get_players_in_room(roomIndex: Optional[str] = None, uid: Optional[str] = None) -> JSONResponse:
    if not uid:
        return JSONResponse({"message": "uid is required"}, status_code=400)

    if roomIndex is None:
        return JSONResponse({"message": "Invalid parameters"}, status_code=400)

    try:
        room_index = int(roomIndex)
    except (ValueError, TypeError):
        return JSONResponse({"message": "Invalid parameters"}, status_code=400)

    session = session_manager.get_player_session(uid)
    if not session:
        return JSONResponse({"message": "User not in a realm."}, status_code=400)

    players = session.get_players_in_room(room_index)
    return JSONResponse({"players": [p.to_dict() for p in players]})


@router.get("/getPlayerCounts")
async def get_player_counts(realmIds: Optional[str] = None) -> JSONResponse:
    if not realmIds:
        return JSONResponse({"message": "Invalid parameters"}, status_code=400)

    realm_id_list = realmIds.split(",")
    if len(realm_id_list) > 100:
        return JSONResponse({"message": "Too many server IDs"}, status_code=400)

    player_counts: List[int] = []
    for realm_id in realm_id_list:
        session = session_manager.get_session(realm_id)
        if session:
            player_counts.append(session.get_player_count())
        else:
            player_counts.append(0)

    return JSONResponse({"playerCounts": player_counts})
