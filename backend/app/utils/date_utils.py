from datetime import datetime, timezone

def parse_date(date_str: str, is_end: bool = False) -> datetime:
    """Parses a YYYY-MM-DD date string into a UTC datetime object."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        if is_end:
            return dt.replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc)
        else:
            return dt.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc)
    except ValueError:
        # Fallback if standard format doesn't match
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc)
