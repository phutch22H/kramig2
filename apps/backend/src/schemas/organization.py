from datetime import datetime
from pydantic import BaseModel


class OrgCreate(BaseModel):
    name: str
    type: str
    description: str | None = None
    logo_url: str | None = None


class OrgUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    logo_url: str | None = None


class OrgResponse(BaseModel):
    id: str
    name: str
    type: str
    description: str | None
    logo_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteRequest(BaseModel):
    email: str
    role: str = "viewer"


class MembershipResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str
    role: str
    created_at: datetime


class RoleUpdateRequest(BaseModel):
    role: str


class OrgShareCreate(BaseModel):
    shared_with_org_id: str
    resource_type: str
    resource_id: str | None = None
    permission: str = "read"


class OrgShareResponse(BaseModel):
    id: str
    owner_org_id: str
    shared_with_org_id: str
    resource_type: str
    resource_id: str | None
    permission: str
    created_at: datetime

    model_config = {"from_attributes": True}
