import time

WINDOW_SECONDS = 60
MAX_REQUESTS = 10

# In-memory only — acceptable for MVP scale (single Render free-tier instance).
# Resets on restart/redeploy; doesn't share state across instances if scaled up.
_request_log: dict[str, list[float]] = {}


def is_rate_limited(client_id: str, now: float | None = None) -> bool:
    now = now if now is not None else time.time()
    timestamps = _request_log.get(client_id, [])
    timestamps = [t for t in timestamps if now - t < WINDOW_SECONDS]

    if len(timestamps) >= MAX_REQUESTS:
        _request_log[client_id] = timestamps
        return True

    timestamps.append(now)
    _request_log[client_id] = timestamps
    return False
