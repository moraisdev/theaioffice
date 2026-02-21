from pydantic import BaseModel


class UpdateSkinBody(BaseModel):
    skin: str


class UpdateVisitedRealmsBody(BaseModel):
    shareId: str
