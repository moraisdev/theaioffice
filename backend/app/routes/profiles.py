from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.database import get_pool, record_to_dict

router = APIRouter(prefix="/api/profiles")


@router.get("/{profile_id}")
async def get_profile(profile_id: str) -> JSONResponse:
    pool = get_pool()
    try:
        # Upsert: create profile if it doesn't exist
        row = await pool.fetchrow(
            "INSERT INTO profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING RETURNING *",
            profile_id,
        )
        if row:
            return JSONResponse(record_to_dict(row))
        # Already exists, fetch it
        existing = await pool.fetchrow(
            "SELECT * FROM profiles WHERE id = $1",
            profile_id,
        )
        return JSONResponse(record_to_dict(existing))
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=500)


@router.put("/{profile_id}/skin")
async def update_skin(profile_id: str, request: Request) -> JSONResponse:
    body = await request.json()
    skin = body.get("skin")
    if not skin:
        return JSONResponse({"message": "skin is required"}, status_code=400)

    pool = get_pool()
    try:
        row = await pool.fetchrow(
            "UPDATE profiles SET skin = $1 WHERE id = $2 RETURNING *",
            skin, profile_id,
        )
        if not row:
            return JSONResponse({"message": "Profile not found"}, status_code=404)
        return JSONResponse(record_to_dict(row))
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=500)


@router.get("/{profile_id}/visited-realms")
async def get_visited_realms(profile_id: str) -> JSONResponse:
    pool = get_pool()
    try:
        profile_row = await pool.fetchrow(
            "SELECT visited_realms FROM profiles WHERE id = $1",
            profile_id,
        )
        if not profile_row:
            return JSONResponse([])

        visited_share_ids: list[str] = profile_row["visited_realms"] or []
        if not visited_share_ids:
            return JSONResponse([])

        realms = []
        to_remove: list[str] = []
        for share_id in visited_share_ids:
            realm_row = await pool.fetchrow(
                "SELECT id, name, share_id FROM realms WHERE share_id = $1::uuid",
                share_id,
            )
            if realm_row:
                realms.append(record_to_dict(realm_row))
            else:
                to_remove.append(share_id)

        # Clean up stale visited realms
        if to_remove:
            cleaned = [sid for sid in visited_share_ids if sid not in to_remove]
            await pool.execute(
                "UPDATE profiles SET visited_realms = $1 WHERE id = $2",
                cleaned, profile_id,
            )

        return JSONResponse(realms)
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=500)


@router.put("/{profile_id}/visited-realms")
async def update_visited_realms(profile_id: str, request: Request) -> JSONResponse:
    body = await request.json()
    share_id = body.get("shareId")
    if not share_id:
        return JSONResponse({"message": "shareId is required"}, status_code=400)

    pool = get_pool()
    try:
        profile_row = await pool.fetchrow(
            "SELECT visited_realms FROM profiles WHERE id = $1",
            profile_id,
        )
        if not profile_row:
            return JSONResponse({"message": "Profile not found"}, status_code=404)

        visited: list[str] = profile_row["visited_realms"] or []
        if share_id in visited:
            return JSONResponse({"success": True})

        visited.append(share_id)
        await pool.execute(
            "UPDATE profiles SET visited_realms = $1 WHERE id = $2",
            visited, profile_id,
        )
        return JSONResponse({"success": True})
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=500)
