from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import date, timedelta
from sqlalchemy import and_, select, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_from_jwt, get_db
from app.models.calendar_event import CalendarEvent
from app.models.message import Message
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
        subject=payload.subject,
        note=payload.note,
        participants=payload.participants,
    )
    db.add(event)

    participant_emails = {
        email.strip().lower()
        for email in (payload.participants or [])
        if isinstance(email, str) and email.strip()
    }
    if current_user.email:
        participant_emails.discard(current_user.email.lower())
    if participant_emails:
        recipients = (
            db.execute(select(User).where(func.lower(User.email).in_(participant_emails)))
            .scalars()
            .all()
        )
        for recipient in recipients:
            db.add(
                CalendarEvent(
                    user_id=recipient.id,
                    date=payload.date,
                    time=payload.time,
                    title=payload.title,
                    subject=payload.subject,
                    note=payload.note,
                    participants=payload.participants,
                )
            )
            body_lines = [
                f"Event: {payload.title}",
                f"Date: {payload.date}",
                f"Time: {payload.time or 'All day'}",
                f"Subject: {payload.subject or '-'}",
                f"Organizer: {current_user.full_name or current_user.email}",
            ]
            if payload.participants:
                body_lines.append(f"Participants: {', '.join(payload.participants)}")
            if payload.note:
                body_lines.append(f"Notes: {payload.note}")
            db.add(
                Message(
                    sender_user_id=current_user.id,
                    recipient_user_id=recipient.id,
                    scope="direct",
                    subject=f"Calendar invite: {payload.title}",
                    body="\n".join(body_lines),
                )
            )
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


@router.get("/alerts", response_model=list[CalendarEventRead])
def list_alerts(
    days: int = Query(default=7, ge=1, le=30),
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> list[CalendarEventRead]:
    today = date.today()
    end = today + timedelta(days=days)
    stmt = (
        select(CalendarEvent)
        .where(
            and_(
                CalendarEvent.user_id == current_user.id,
                CalendarEvent.date >= today,
                CalendarEvent.date <= end,
            )
        )
        .order_by(CalendarEvent.date.asc(), CalendarEvent.time.asc().nulls_last())
    )
    events = db.execute(stmt).scalars().all()
    return [CalendarEventRead.model_validate(event, from_attributes=True) for event in events]
