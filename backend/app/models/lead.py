import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LeadStage(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    SITE_VISIT = "SITE_VISIT"
    INTERESTED = "INTERESTED"
    NEGOTIATION = "NEGOTIATION"
    BOOKED = "BOOKED"
    LOST = "LOST"


class LeadSource(str, enum.Enum):
    WEBSITE = "WEBSITE"
    REFERRAL = "REFERRAL"
    WALK_IN = "WALK_IN"
    PHONE_INQUIRY = "PHONE_INQUIRY"
    SOCIAL_MEDIA = "SOCIAL_MEDIA"
    ADVERTISEMENT = "ADVERTISEMENT"
    OTHER = "OTHER"


class Lead(Base):
    __tablename__ = "leads"
    __table_args__ = (
        Index("ix_leads_stage", "stage"),
        Index("ix_leads_assigned_to", "assigned_to"),
        Index("ix_leads_next_follow_up", "next_follow_up"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[LeadSource] = mapped_column(Enum(LeadSource, name="lead_source"), default=LeadSource.OTHER)
    stage: Mapped[LeadStage] = mapped_column(Enum(LeadStage, name="lead_stage"), default=LeadStage.NEW, nullable=False)
    assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    next_follow_up: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    assigned_to_user = relationship("User", back_populates="leads", foreign_keys=[assigned_to])
    notes = relationship("LeadNote", back_populates="lead", cascade="all, delete-orphan", order_by="LeadNote.created_at")
    bookings = relationship("Booking", back_populates="lead")


class LeadNote(Base):
    __tablename__ = "lead_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="notes")
    created_by_user = relationship("User", back_populates="lead_notes")
