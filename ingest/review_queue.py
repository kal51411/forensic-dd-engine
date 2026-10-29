"""Human review queue persistence and status tracker."""

import json
from pathlib import Path
from typing import List, Optional
from ingest.models import HumanReviewItem


class HumanReviewQueue:
    """Manages low-confidence extraction cells awaiting human verification."""

    def __init__(self, file_path: str = "human_review_queue.jsonl"):
        self.file_path = Path(file_path)

    def enqueue(self, items: List[HumanReviewItem]) -> None:
        """Add new flagged items to the queue."""
        if not items:
            return
        existing_ids = {item.item_id for item in self.list_all()}
        with open(self.file_path, "a", encoding="utf-8") as f:
            for item in items:
                if item.item_id not in existing_ids:
                    f.write(json.dumps(item.model_dump()) + "\n")
                    existing_ids.add(item.item_id)

    def list_all(self, status: Optional[str] = None) -> List[HumanReviewItem]:
        """Read all items from the queue with optional status filter."""
        if not self.file_path.exists():
            return []
        items = []
        with open(self.file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    item = HumanReviewItem(**json.loads(line.strip()))
                    if status is None or item.status == status:
                        items.append(item)
        return items

    def resolve(self, item_id: str, resolved_value: float) -> bool:
        """Mark an item as resolved with a human-verified numeric value."""
        items = self.list_all()
        found = False
        updated_items = []
        for it in items:
            if it.item_id == item_id:
                it.status = "RESOLVED"
                it.resolved_value = resolved_value
                found = True
            updated_items.append(it)

        if found:
            with open(self.file_path, "w", encoding="utf-8") as f:
                for it in updated_items:
                    f.write(json.dumps(it.model_dump()) + "\n")
        return found
