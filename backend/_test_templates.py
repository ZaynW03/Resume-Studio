"""Quick validation of all 3 templates."""
from app.services.renderer import render_html
from app.models.schema import Resume
import json

with open("data/resumes/9bab82ec8018.json", encoding="utf-8") as f:
    data = json.load(f)

for tpl in ["flowcv-style", "classic", "minimal"]:
    r = Resume(**data)
    r.customize.template = tpl
    r.customize.columns = "two"  # test double columns
    r.customize.contacts_columns = "double"  # test double arrangement
    try:
        html = render_html(r)
        has = lambda s: s in html
        parts = []
        if has("name-role-wrapper"): parts.append("name-role")
        if has("contact-list") or has("contact-line"): parts.append("contacts")
        if has("modules-wrapper"): parts.append("modules-wrap")
        if has("column-count: 2") or has("column-count:2"): parts.append("2-col-css")
        if has("grid-template-columns: 1fr 1fr"): parts.append("double-contacts")
        if has("photo"): parts.append("photo")
        print(f"{tpl}: OK ({len(html)}b) [{', '.join(parts)}]")
    except Exception as e:
        print(f"{tpl}: ERROR - {e}")
