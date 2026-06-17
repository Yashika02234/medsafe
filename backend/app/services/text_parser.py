import re
from typing import Optional

# Ordered most-specific-first: an "EXP"-labeled date is a much stronger signal
# than a bare MM/YYYY pattern, which could be a batch number or anything else.
EXPIRY_PATTERNS = [
    re.compile(r"EXP(?:IRY)?\.?:?\s*(\d{2}[/-]\d{4})", re.IGNORECASE),
    re.compile(r"EXP(?:IRY)?\.?:?\s*([A-Z]{3}[/-]?\d{4})", re.IGNORECASE),
    re.compile(r"(\d{2}[/-]\d{4})"),
]


def parse_expiry(raw_text: str) -> Optional[str]:
    for pattern in EXPIRY_PATTERNS:
        match = pattern.search(raw_text)
        if match:
            return match.group(1)
    return None


def parse_medicine_name(words: list[dict]) -> Optional[str]:
    """Heuristic: medicine strips print the brand name in the largest font on the
    strip, so the OCR line with the tallest average word height is usually it."""
    if not words:
        return None

    lines: dict[int, list[dict]] = {}
    for w in words:
        lines.setdefault(w["line_num"], []).append(w)

    def avg_height(line_words: list[dict]) -> float:
        return sum(w["height"] for w in line_words) / len(line_words)

    best_line = max(lines.values(), key=avg_height)
    return " ".join(w["text"] for w in best_line)


def parse_medicine_info(raw_text: str, words: list[dict]) -> dict:
    return {
        "medicine_name": parse_medicine_name(words),
        "expiry_date": parse_expiry(raw_text),
    }
