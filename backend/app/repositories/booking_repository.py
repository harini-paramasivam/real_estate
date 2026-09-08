from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.unit import Unit


def get_unit_for_update(db: Session, unit_id: int) -> Unit | None:
    """
    Lock the unit row for the duration of the current transaction.

    SELECT ... FOR UPDATE blocks any other transaction from locking or
    updating the same row until this transaction commits or rolls back.
    Two concurrent booking requests for the same unit will therefore be
    serialized here: the first to arrive gets the lock and proceeds, the
    second blocks until the first transaction finishes, then re-reads the
    now-updated (BOOKED) status and is correctly rejected.
    """
    stmt = select(Unit).where(Unit.id == unit_id).with_for_update()
    return db.execute(stmt).scalar_one_or_none()
