"""Upload a PDF or image resume; get structured JSON back."""
from __future__ import annotations
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel, ValidationError

from app.services import parser, storage
from app.models.schema import (
    Resume, PersonalDetails, ResumeModule,
    ExperienceEntry, EducationEntry, ProjectEntry,
    SkillEntry, AwardEntry, SummaryEntry, default_modules,
)

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), save: bool = True):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED:
        raise HTTPException(400, f"Unsupported file type: {suffix}")

    token = uuid4().hex
    dest = UPLOAD_DIR / f"{token}{suffix}"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        resume, raw_text = parser.parse_resume_file(dest)
    except Exception as e:
        raise HTTPException(500, f"Parse failed: {e}")

    saved = None
    if save:
        saved = storage.save_resume(resume)

    return {
        "resume": (saved or resume).model_dump(),
        "raw_text_preview": raw_text[:2000],
        "file_url": f"/uploads/{dest.name}",
    }


class JsonImportBody(BaseModel):
    data: dict
    save: bool = True


def _loc_str(loc: dict | str) -> str:
    if isinstance(loc, str):
        return loc
    parts = [loc.get("city"), loc.get("region"), loc.get("countryCode")]
    return ", ".join(p for p in parts if p)


def _from_jsonresume(raw: dict, warnings: list[str]) -> Resume:
    """Map from JSON Resume standard format (jsonresume.org)."""
    basics = raw.get("basics", {})
    personal = PersonalDetails(
        full_name=basics.get("name", ""),
        job_title=basics.get("label", ""),
        email=basics.get("email", ""),
        phone=basics.get("phone", ""),
        website=basics.get("url", basics.get("website", "")),
        location=_loc_str(basics.get("location", {})),
    )
    for p in basics.get("profiles", []):
        network = (p.get("network") or "").lower()
        url = p.get("url", "")
        if "linkedin" in network:
            personal.linkedin = url
        elif "github" in network:
            personal.github = url

    modules: list[ResumeModule] = []

    summary_text = basics.get("summary", "")
    if summary_text:
        modules.append(ResumeModule(
            type="summary", name="Summary", icon="file-text",
            entries=[SummaryEntry(content=summary_text).model_dump()],
        ))

    work = raw.get("work", [])
    if work:
        entries = [ExperienceEntry(
            company=w.get("name", w.get("company", "")),
            position=w.get("position", ""),
            start_date=w.get("startDate", ""),
            end_date=w.get("endDate", ""),
            location=w.get("location", ""),
            description=w.get("summary", w.get("description", "")),
            currently_working=not bool(w.get("endDate")),
        ).model_dump() for w in work]
        modules.append(ResumeModule(type="experience", name="Experience", icon="briefcase", entries=entries))

    edu = raw.get("education", [])
    if edu:
        entries = [EducationEntry(
            school=e.get("institution", ""),
            degree=e.get("studyType", ""),
            field_of_study=e.get("area", ""),
            start_date=e.get("startDate", ""),
            end_date=e.get("endDate", ""),
            gpa=str(e.get("score", e.get("gpa", ""))),
        ).model_dump() for e in edu]
        modules.append(ResumeModule(type="education", name="Education", icon="graduation-cap", entries=entries))

    projects = raw.get("projects", [])
    if projects:
        entries = [ProjectEntry(
            name=p.get("name", ""),
            role=(p.get("roles") or [None])[0] or "",
            start_date=p.get("startDate", ""),
            end_date=p.get("endDate", ""),
            link=p.get("url", ""),
            description=p.get("description", p.get("summary", "")),
        ).model_dump() for p in projects]
        modules.append(ResumeModule(type="projects", name="Projects", icon="folder-git-2", entries=entries))

    skills = raw.get("skills", [])
    if skills:
        entries = [SkillEntry(
            category=s.get("name", ""),
            items=s.get("keywords", [s["name"]] if s.get("name") else []),
            level=s.get("level", ""),
        ).model_dump() for s in skills]
        modules.append(ResumeModule(type="skills", name="Skills", icon="wrench", entries=entries))

    awards = raw.get("awards", [])
    if awards:
        entries = [AwardEntry(
            title=a.get("title", ""),
            issuer=a.get("awarder", ""),
            date=a.get("date", ""),
            description=a.get("summary", ""),
        ).model_dump() for a in awards]
        modules.append(ResumeModule(type="awards", name="Awards", icon="award", entries=entries))

    return Resume(
        personal=personal,
        modules=modules,
        title=personal.full_name or "Imported Resume",
    )


def _map_json_to_resume(raw: dict) -> tuple[Resume, list[str]]:
    """Convert raw JSON to a canonical Resume. Returns (resume, warnings)."""
    warnings: list[str] = []

    # 1. Canonical Resume format — validate directly
    try:
        return Resume.model_validate(raw), warnings
    except (ValidationError, Exception):
        pass

    # 2. JSON Resume standard (jsonresume.org)
    if "basics" in raw or "work" in raw:
        return _from_jsonresume(raw, warnings), warnings

    # 3. Generic flat fallback
    warnings.append("Unrecognised JSON format; only basic personal fields were imported")
    personal = PersonalDetails(
        full_name=raw.get("name", raw.get("full_name", "")),
        email=raw.get("email", ""),
        phone=raw.get("phone", ""),
        job_title=raw.get("title", raw.get("job_title", "")),
    )
    return Resume(personal=personal, modules=default_modules(),
                  title=personal.full_name or "Imported Resume"), warnings


@router.post("/json")
async def import_json_resume(body: JsonImportBody):
    try:
        resume, warnings = _map_json_to_resume(body.data)
    except Exception as e:
        raise HTTPException(400, f"JSON import failed: {e}")

    saved = None
    if body.save:
        try:
            saved = storage.save_resume(resume)
        except Exception as e:
            raise HTTPException(500, f"Save failed: {e}")

    return {
        "resume": (saved or resume).model_dump(),
        "warnings": warnings,
    }


@router.post("/photo")
async def upload_photo(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    allowed = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}
    if suffix not in allowed:
        raise HTTPException(
            400,
            f"Unsupported image type '{suffix}'. Allowed: {', '.join(sorted(allowed))}"
        )
    token = uuid4().hex
    dest = UPLOAD_DIR / f"photo_{token}{suffix}"
    try:
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(500, f"Failed to write file: {e}")
    return {"url": f"/uploads/{dest.name}"}
