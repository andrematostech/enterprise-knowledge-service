from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_from_jwt, get_db
from app.models.calendar_event import CalendarEvent
from app.models.user import User
from app.schemas.calendar import CalendarEventCreate, CalendarEventRead, CalendarEventUpdate


router = APIRouter(prefix="/calendar", tags=["calendar"])


def month_range(month: str) -> tuple[date, date]:
    try:
        year_str, month_str = month.split("-", 1)
        year = int(year_str)
        month_value = int(month_str)
        if not 1 <= month_value <= 12:
            raise ValueError
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid month format") from exc
    start = date(year, month_value, 1)
    if month_value == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month_value + 1, 1)
    return start, end


@router.get("/events", response_model=list[CalendarEventRead])
def list_events(
    month: str | None = Query(default=None, description="YYYY-MM"),
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> list[CalendarEventRead]:
    stmt = select(CalendarEvent).where(CalendarEvent.user_id == current_user.id)
    if month:
        start, end = month_range(month)
        stmt = stmt.where(and_(CalendarEvent.date >= start, CalendarEvent.date < end))
    events = db.execute(stmt.order_by(CalendarEvent.date.asc(), CalendarEvent.time.asc().nulls_last())).scalars().all()
    return [CalendarEventRead.model_validate(event, from_attributes=True) for event in events]


@router.post("/events", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: CalendarEventCreate,
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> CalendarEventRead:
    event = CalendarEvent(
        user_id=current_user.id,
        date=payload.date,
        time=payload.time,
        title=payload.title,
        note=payload.note,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return CalendarEventRead.model_validate(event, from_attributes=True)


@router.patch("/events/{event_id}", response_model=CalendarEventRead)
def update_event(
    event_id: str,
    payload: CalendarEventUpdate,
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> CalendarEventRead:
    event = db.execute(
        select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id)
    ).scalars().first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.add(event)
    db.commit()
    db.refresh(event)
    return CalendarEventRead.model_validate(event, from_attributes=True)


@router.delete("/events/{event_id}")
def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> dict:
    event = db.execute(
        select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id)
    ).scalars().first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"detail": "Event deleted"}
