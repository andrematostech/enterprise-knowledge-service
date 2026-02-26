from datetime import date, datetime, time
import uuid

from pydantic import BaseModel, Field


class CalendarEventBase(BaseModel):
    date: date
    time: time | None = None
    title: str = Field(min_length=1, max_length=255)
    note: str | None = None


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    date: date | None = None
    time: time | None = None
    title: str | None = Field(default=None, max_length=255)
    note: str | None = None


class CalendarEventRead(CalendarEventBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
