#!/usr/bin/env python3
"""Export DIGIPATHS Patient Message Library xlsx to JSON for the patient app."""

from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "docs" / "DIGIPATHS_Patient_Message_Library.xlsx"
OUT_DIR = ROOT / "src" / "data" / "messages"

CLINICIAN_ONLY = "(no automated message - clinician contact only)"


def col_row(cell_ref: str) -> tuple[int, int]:
    m = re.match(r"([A-Z]+)(\d+)", cell_ref)
    col, row = m.group(1), int(m.group(2))
    n = 0
    for c in col:
        n = n * 26 + (ord(c) - 64)
    return n, row


def load_workbook(path: Path):
    with zipfile.ZipFile(path) as z:
        ss: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall("m:si", NS):
                texts = [
                    t.text or ""
                    for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
                ]
                ss.append("".join(texts))

        wb = ET.fromstring(z.read("xl/workbook.xml"))
        sheets = [
            (
                sh.attrib.get("name"),
                sh.attrib.get(
                    "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
                ),
            )
            for sh in wb.findall("m:sheets/m:sheet", NS)
        ]
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        rid_to_target = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}

        def cell_value(c):
            t = c.attrib.get("t")
            v = c.find("m:v", NS)
            if v is None or v.text is None:
                return None
            if t == "s":
                return ss[int(v.text)]
            return v.text

        def load_sheet(name: str) -> list[dict]:
            rid = dict(sheets)[name]
            target = rid_to_target[rid]
            if not target.startswith("xl/"):
                target = "xl/" + target
            root = ET.fromstring(z.read(target))
            rows: dict[int, dict[int, object]] = defaultdict(dict)
            max_col = 0
            for c in root.findall(".//m:c", NS):
                ref = c.attrib.get("r")
                if not ref:
                    continue
                col, row = col_row(ref)
                rows[row][col] = cell_value(c)
                max_col = max(max_col, col)
            headers = [rows.get(1, {}).get(i) for i in range(1, max_col + 1)]
            data = []
            for r in range(2, max(rows) + 1):
                data.append({headers[i - 1]: rows[r].get(i) for i in range(1, max_col + 1)})
            return data

        return {
            "Medications": load_sheet("Medications"),
            "Conditions": load_sheet("Conditions"),
            "Lab_Results": load_sheet("Lab_Results"),
        }


def split_sources(raw) -> list[str]:
    if not raw:
        return []
    return [p.strip() for p in str(raw).split(";") if p.strip()]


def to_float(val):
    if val is None or val == "":
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def export_medications(rows: list[dict]) -> list[dict]:
    by_generic: dict[str, dict] = {}
    for row in rows:
        generic = (row.get("generic_name") or "").strip()
        if not generic:
            continue
        entry = by_generic.setdefault(
            generic,
            {
                "genericName": generic,
                "sourceNames": [],
                "drugClass": row.get("drug_class") or None,
                "category": row.get("category (sheet colour)") or None,
                "messages": {},
            },
        )
        for name in split_sources(row.get("source_names (EMR)")):
            if name not in entry["sourceNames"]:
                entry["sourceNames"].append(name)
        mt = row.get("message_type")
        msg = row.get("message")
        if mt and msg:
            entry["messages"][mt] = msg
    return sorted(by_generic.values(), key=lambda x: x["genericName"].lower())


def export_conditions(rows: list[dict]) -> list[dict]:
    by_name: dict[str, dict] = {}
    for row in rows:
        name = (row.get("patient_facing_name") or "").strip()
        if not name:
            continue
        entry = by_name.setdefault(
            name,
            {
                "patientFacingName": name,
                "conceptId": row.get("concept_id"),
                "sourceNames": [],
                "group": row.get("group") or None,
                "messages": {},
                "clinicianContactOnly": False,
            },
        )
        for src in split_sources(row.get("source_names (EMR)")):
            if src not in entry["sourceNames"]:
                entry["sourceNames"].append(src)
        mt = row.get("message_type")
        msg = row.get("message")
        if mt and msg:
            if CLINICIAN_ONLY in str(msg):
                entry["clinicianContactOnly"] = True
                entry["messages"][mt] = None
            else:
                entry["messages"][mt] = msg
    return sorted(by_name.values(), key=lambda x: x["patientFacingName"].lower())


def export_labs(rows: list[dict]) -> list[dict]:
    by_test: dict[str, dict] = {}
    for row in rows:
        test = (row.get("test") or "").strip()
        if not test:
            continue
        entry = by_test.setdefault(
            test,
            {
                "test": test,
                "conceptId": row.get("concept_id"),
                "sourceNames": [],
                "unit": row.get("unit") or None,
                "bands": [],
            },
        )
        for src in split_sources(row.get("source_names (EMR)")):
            if src not in entry["sourceNames"]:
                entry["sourceNames"].append(src)
        if row.get("unit") and not entry["unit"]:
            entry["unit"] = row.get("unit")
        entry["bands"].append(
            {
                "context": row.get("context") or "All",
                "band": row.get("band") or None,
                "lower": to_float(row.get("lower_limit (>=)")),
                "upper": to_float(row.get("upper_limit (<)")),
                "message": row.get("message") or None,
                "messageId": row.get("message_id"),
            }
        )
    return sorted(by_test.values(), key=lambda x: x["test"].lower())


def main() -> None:
    sheets = load_workbook(XLSX)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    meds = export_medications(sheets["Medications"])
    conds = export_conditions(sheets["Conditions"])
    labs = export_labs(sheets["Lab_Results"])

    outputs = {
        "medications.json": meds,
        "conditions.json": conds,
        "labResults.json": labs,
    }
    for filename, data in outputs.items():
        path = OUT_DIR / filename
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Wrote {path.relative_to(ROOT)} ({len(data)} entries)")


if __name__ == "__main__":
    main()
