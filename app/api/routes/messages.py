from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_from_jwt, get_db
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageCreate, MessageRead


router = APIRouter(prefix="/messages", tags=["messages"])


def is_admin_user(db: Session, user: User) -> bool:
    first_user = db.execute(select(User).order_by(User.created_at.asc())).scalars().first()
    return bool(first_user and first_user.id == user.id)


@router.get("/inbox", response_model=list[MessageRead])
def inbox(
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> list[MessageRead]:
    messages = (
        db.execute(
            select(Message)
            .where(
                or_(
                    Message.scope == "broadcast",
                    Message.recipient_user_id == current_user.id,
                    Message.sender_user_id == current_user.id,
                )
            )
            .order_by(Message.created_at.desc())
        )
        .scalars()
        .all()
    )
    result: list[MessageRead] = []
    for message in messages:
        result.append(
            MessageRead.model_validate(
                {
                    **message.__dict__,
                    "sender_email": message.sender.email if message.sender else None,
                    "sender_name": message.sender.full_name if message.sender else None,
                    "sender_position": message.sender.position if message.sender else None,
                    "sender_avatar_url": message.sender.avatar_url if message.sender else None,
                    "recipient_email": message.recipient.email if message.recipient else None,
                },
                from_attributes=True,
            )
        )
    return result


@router.post("", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: MessageCreate,
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> MessageRead:
    if payload.scope == "broadcast":
        if not is_admin_user(db, current_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to broadcast")
        message = Message(
            sender_user_id=current_user.id,
            recipient_user_id=None,
            scope="broadcast",
            subject=payload.subject,
            body=payload.body,
        )
    else:
        if not payload.recipient_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipient email required")
        recipient = db.execute(select(User).where(User.email == payload.recipient_email)).scalars().first()
        if not recipient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found")
        message = Message(
            sender_user_id=current_user.id,
            recipient_user_id=recipient.id,
            scope="direct",
            subject=payload.subject,
            body=payload.body,
        )
    db.add(message)
    db.commit()
    db.refresh(message)
    return MessageRead.model_validate(
        {
            **message.__dict__,
            "sender_email": current_user.email,
            "sender_name": current_user.full_name,
            "sender_position": current_user.position,
            "sender_avatar_url": current_user.avatar_url,
            "recipient_email": payload.recipient_email if payload.scope == "direct" else None,
        },
        from_attributes=True,
    )


@router.post("/{message_id}/read", response_model=MessageRead)
def mark_read(
    message_id: uuid.UUID,
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> MessageRead:
    message = db.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if message.scope != "direct" or message.recipient_user_id != current_user.id:
        return MessageRead.model_validate(
            {
                **message.__dict__,
                "sender_email": message.sender.email if message.sender else None,
                "sender_name": message.sender.full_name if message.sender else None,
                "sender_position": message.sender.position if message.sender else None,
                "sender_avatar_url": message.sender.avatar_url if message.sender else None,
                "recipient_email": message.recipient.email if message.recipient else None,
            },
            from_attributes=True,
        )
    if not message.read_at:
        message.read_at = datetime.utcnow()
        db.add(message)
        db.commit()
        db.refresh(message)
    return MessageRead.model_validate(
        {
            **message.__dict__,
            "sender_email": message.sender.email if message.sender else None,
            "sender_name": message.sender.full_name if message.sender else None,
            "sender_position": message.sender.position if message.sender else None,
            "sender_avatar_url": message.sender.avatar_url if message.sender else None,
            "recipient_email": message.recipient.email if message.recipient else None,
        },
        from_attributes=True,
    )


@router.delete("/{message_id}", response_model=MessageRead)
def delete_message(
    message_id: uuid.UUID,
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> MessageRead:
    message = db.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    is_sender = message.sender_user_id == current_user.id
    is_recipient = message.recipient_user_id == current_user.id
    is_admin = is_admin_user(db, current_user)

    if message.scope == "broadcast":
        if not (is_sender or is_admin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to delete this message")
    else:
        if not (is_sender or is_recipient):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to delete this message")

    payload = MessageRead.model_validate(
        {
            **message.__dict__,
            "sender_email": message.sender.email if message.sender else None,
            "sender_name": message.sender.full_name if message.sender else None,
            "sender_position": message.sender.position if message.sender else None,
            "sender_avatar_url": message.sender.avatar_url if message.sender else None,
            "recipient_email": message.recipient.email if message.recipient else None,
        },
        from_attributes=True,
    )
    db.delete(message)
    db.commit()
    return payload
