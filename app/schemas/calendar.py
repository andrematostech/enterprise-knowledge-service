from __future__ import annotations
import datetime as dt
from typing import Optional
import uuid

from pydantic import BaseModel, Field


class CalendarEventBase(BaseModel):
    date: dt.date
    time: Optional[dt.time] = None
    title: str = Field(min_length=1, max_length=255)
    subject: Optional[str] = Field(default=None, max_length=255)
    note: Optional[str] = None
    participants: Optional[list[str]] = None


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    date: Optional[dt.date] = None
    time: Optional[dt.time] = None
    title: Optional[str] = Field(default=None, max_length=255)
    subject: Optional[str] = Field(default=None, max_length=255)
    note: Optional[str] = None
    participants: Optional[list[str]] = None


class CalendarEventRead(CalendarEventBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: dt.datetime
    updated_at: dt.datetime

    model_config = {"from_attributes": True}
