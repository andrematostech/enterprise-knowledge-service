from __future__ import annotations
from datetime import date, datetime, time
from typing import Optional
import uuid

from pydantic import BaseModel, Field


class CalendarEventBase(BaseModel):
    date: date
    time: Optional[time] = None
    title: str = Field(min_length=1, max_length=255)
    note: Optional[str] = None


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    date: Optional[date] = None
    time: Optional[time] = None
    title: Optional[str] = Field(default=None, max_length=255)
    note: Optional[str] = None


class CalendarEventRead(CalendarEventBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
