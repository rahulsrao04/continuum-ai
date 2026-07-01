"""In-memory Supabase-compatible store for local e2e testing."""
from __future__ import annotations

import copy
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class MockResult:
    data: list[dict] = field(default_factory=list)
    count: Optional[int] = None


class MockQuery:
    def __init__(self, store: "MockStore", table: str, op: str = "select"):
        self.store = store
        self.table = table
        self.op = op
        self.filters: list[tuple[str, str, Any]] = []
        self._select_cols = "*"
        self._order_col: Optional[str] = None
        self._order_desc = False
        self._limit: Optional[int] = None
        self._insert_payload: Optional[dict | list] = None
        self._update_payload: Optional[dict] = None
        self._count_exact = False

    def select(self, *cols, count: Optional[str] = None):
        self._select_cols = cols[0] if cols else "*"
        self._count_exact = count == "exact"
        return self

    def insert(self, payload: dict | list):
        self.op = "insert"
        self._insert_payload = payload
        return self

    def update(self, payload: dict):
        self.op = "update"
        self._update_payload = payload
        return self

    def delete(self):
        self.op = "delete"
        return self

    def eq(self, col: str, val: Any):
        self.filters.append(("eq", col, val))
        return self

    def order(self, col: str, desc: bool = False):
        self._order_col = col
        self._order_desc = desc
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def _match(self, row: dict) -> bool:
        for op, col, val in self.filters:
            if op == "eq" and str(row.get(col)) != str(val):
                return False
        return True

    def _apply_query(self, rows: list[dict]) -> list[dict]:
        out = [copy.deepcopy(r) for r in rows if self._match(r)]
        if self._order_col:
            out.sort(key=lambda r: r.get(self._order_col, ""), reverse=self._order_desc)
        if self._limit is not None:
            out = out[: self._limit]
        return out

    def execute(self) -> MockResult:
        table_rows: list[dict] = self.store.tables.setdefault(self.table, [])

        if self.op == "insert":
            payload = self._insert_payload
            items = payload if isinstance(payload, list) else [payload]
            inserted = []
            for item in items:
                row = copy.deepcopy(item)
                if "id" not in row:
                    row["id"] = str(uuid.uuid4())
                if "created_at" not in row:
                    row["created_at"] = _now_iso()
                if "updated_at" not in row and self.table == "platform_sessions":
                    row["updated_at"] = _now_iso()
                table_rows.append(row)
                inserted.append(copy.deepcopy(row))
            return MockResult(data=inserted)

        if self.op == "update":
            updated = []
            for row in table_rows:
                if self._match(row):
                    row.update(self._update_payload or {})
                    if "updated_at" in row or self.table == "platform_sessions":
                        row["updated_at"] = _now_iso()
                    updated.append(copy.deepcopy(row))
            return MockResult(data=updated)

        if self.op == "delete":
            kept = [r for r in table_rows if not self._match(r)]
            deleted_count = len(table_rows) - len(kept)
            self.store.tables[self.table] = kept
            return MockResult(data=[], count=deleted_count)

        # select
        rows = self._apply_query(table_rows)
        if self._count_exact:
            return MockResult(data=rows, count=len(rows))
        return MockResult(data=rows)


class MockStore:
    def __init__(self):
        self.tables: dict[str, list[dict]] = {
            "users": [{"id": "550e8400-e29b-41d4-a716-446655440000", "email": "test@example.com"}],
            "projects": [],
            "checkpoints": [],
            "platform_sessions": [],
        }

    def table(self, name: str) -> MockQuery:
        return MockQuery(self, name)


mock_store = MockStore()


class MockSupabaseClient:
    def table(self, name: str) -> MockQuery:
        return mock_store.table(name)
