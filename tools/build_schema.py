# -*- coding: utf-8 -*-
"""يولّد schema.js من index.html — شغّله بعد أي تعديل على نصوص الصفحة أو حقولها.

    pip install beautifulsoup4
    python tools/build_schema.py

schema.js هو المصدر الواحد للحقول القابلة للتعديل: يقرؤه الموقع ليطبّق المحتوى،
وتقرؤه لوحة إدارة المتجر لتعرض الحقول وقيمها الافتراضية.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString

ROOT = Path(__file__).resolve().parent.parent

G1, G2, G3, G4 = "الشريط العلوي", "الرئيسية", "قسم المشاريع (العناوين)", "قسم الخبرات"
G5, G6, G7 = "قسم عن AXIS", "قسم منهجنا", "قسم لنبدأ (التواصل)"
G8 = "التذييل وشريط التنقل السفلي"

FIELDS: list[dict] = []


def F(group, key, label, sel=None, nth=None, **extra):
    row = {"group": group, "key": key, "label": label}
    if sel:
        row["sel"] = sel
    if nth is not None:
        row["nth"] = nth
    row.update(extra)
    FIELDS.append(row)


for i in range(3):
    F(G1, f"nav.{i}", f"رابط القائمة {i + 1}", "header nav a", i)
F(G1, "nav.cta", "زر الشريط العلوي", ".nav-cta")
F(G2, "hero.eyebrow", "السطر الصغير أعلى العنوان", ".hero .eyebrow")
F(G2, "hero.h1", "العنوان الرئيسي", ".hero h1")
F(G2, "hero.p", "الشرح", ".hero-copy>p")
F(G2, "hero.btn", "الزر الرئيسي", ".hero-actions .button")
F(G2, "hero.link", "الرابط الثانوي", ".hero-actions .text-link")
F(G2, "hero.foot1", "سطر أسفل (يمين)", ".hero-foot span", 0)
F(G2, "hero.foot2", "سطر أسفل (يسار)", ".hero-foot span", 1)
F(G2, "hero.artLabel", "نص أعلى بطاقة الشعار", ".art-label")
F(G2, "hero.artCaption", "نص داخل بطاقة الشعار", ".art-caption")
F(G2, "hero.artProject", "شريط أسفل بطاقة الشعار", ".art-project")
for i in range(4):
    F(G2, f"disc.{i}", f"شريط التخصصات {i + 1}", ".disciplines span", i)
F(G3, "work.eyebrow", "السطر الصغير", "#work .section-head .eyebrow")
F(G3, "work.h2", "العنوان", "#work .section-head h2")
F(G3, "work.p", "الشرح", "#work .section-head>p")
F(G3, "work.note", "الملاحظة أسفل المشاريع", ".project-note span")
F(G3, "work.noteLink", "رابط الملاحظة", ".project-note a")
F(G4, "exp.eyebrow", "السطر الصغير", "#expertise .section-head .eyebrow")
F(G4, "exp.h2", "العنوان", "#expertise .section-head h2")
F(G4, "exp.p", "الشرح", "#expertise .section-head>p")
for i in range(3):
    F(G4, f"svc.{i}.h3", f"الخدمة {i + 1} — العنوان", ".services article h3", i)
    F(G4, f"svc.{i}.p", f"الخدمة {i + 1} — الشرح", ".services article p", i)
    F(G4, f"svc.{i}.en", f"الخدمة {i + 1} — السطر الإنجليزي", ".services .service-en", i)
F(G5, "about.eyebrow", "السطر الصغير", "#about .eyebrow")
F(G5, "about.h2", "العنوان", "#about h2")
F(G5, "about.lead", "الجملة البارزة", ".about-copy .lead")
F(G5, "about.p", "الشرح", ".about-copy p:not(.lead)")
for i in range(3):
    F(G5, f"about.val.{i}", f"القيمة {i + 1}", ".values span", i)
F(G6, "proc.eyebrow", "السطر الصغير", ".process .eyebrow")
F(G6, "proc.h2", "العنوان", ".process h2")
for i in range(4):
    F(G6, f"step.{i}.h3", f"الخطوة {i + 1} — العنوان", ".steps article h3", i)
    F(G6, f"step.{i}.p", f"الخطوة {i + 1} — الشرح", ".steps article p", i)
F(G7, "contact.eyebrow", "السطر الصغير", "#contact .eyebrow")
F(G7, "contact.h2", "العنوان", "#contact h2")
F(G7, "contact.p", "الشرح", ".contact-side>p")
F(G7, "contact.label", "عنوان حقل الكتابة", ".contact-side label")
F(G7, "contact.ph", "النص التوضيحي داخل الحقل", "#brief", attr="placeholder")
F(G7, "contact.btn", "الزر", "#copy-brief")
F(G7, "contact.feedback", "الملاحظة أسفل الزر", "#feedback")
F(G8, "footer.tag", "جملة التذييل", "footer>span", 0)
F(G8, "footer.copy", "حقوق النشر", "footer>span", 1)
for i, name in enumerate(["الرئيسية", "المشاريع", "الخبرات", "عن AXIS", "منهجنا", "لنبدأ"]):
    F(G8, f"scene.{i}", f"اسم القسم {i + 1} في الشريط السفلي", virtual=True, **{"def": name})

PROJECTS = [
    {"id": "store", "style": "store", "eco": "AXIS ECOSYSTEM", "big": "AXIS\nSTORE",
     "tag": "DIGITAL. CONNECTED. YOURS.", "bottom": "تجربة تسوّق رقمية متكاملة",
     "title": "AXIS STORE", "meta": "متجر رقمي · تطوير وتصميم",
     "summary": "واجهة واحدة تجمع الخدمات الرقمية مع تجربة عميل واضحة ومترابطة.",
     "type": "01 / متجر رقمي",
     "desc": "مشروع AXIS للتجارة والخدمات الرقمية، يجمع عرض الخدمات وحسابات العملاء ضمن تجربة تحمل هوية الشركة.",
     "features": ["واجهة متجر بهوية AXIS البصرية", "حسابات وملفات للعملاء", "تكامل مع مجتمع AXIS"],
     "url": "https://axissstore.com", "cover": "", "gallery": []},
    {"id": "community", "style": "community", "eco": "AXIS ECOSYSTEM", "big": "مجتمع\nAXIS.",
     "tag": "مساحة تجمعنا", "bottom": "أفكار. تجارب. تواصل.", "title": "مجتمع AXIS",
     "meta": "منصة اجتماعية · تجربة مستخدم",
     "summary": "مساحة للعملاء لمشاركة اليوميات والأفكار وبناء علاقات داخل عالم AXIS.",
     "type": "02 / مجتمع رقمي",
     "desc": "مساحة اجتماعية داخل منظومة AXIS STORE، تتيح للعملاء مشاركة تجاربهم والتواصل مع بعضهم ومتابعة منشورات الإدارة.",
     "features": ["منشورات وصور وملفات شخصية", "طلبات صداقة ورسائل بين الأعضاء",
                  "إعلانات رسمية وإدارة للمجتمع"],
     "url": "https://axissstore.com/community/", "cover": "", "gallery": []},
]


def to_text(el, field) -> str:
    """مطابق لـ toText في content.js: الأسطر بـ \\n والمميَّز بين نجمتين."""
    if field.get("attr"):
        return el.get(field["attr"]) or ""
    node = copy.copy(el)
    for n in node.select(".line"):
        n.decompose()
    for n in node.find_all("br"):
        n.replace_with(NavigableString("\n"))
    for n in node.find_all(["span", "b", "strong"]):
        n.replace_with(NavigableString("*" + n.get_text() + "*"))
    return node.get_text().strip()


def main() -> None:
    soup = BeautifulSoup((ROOT / "index.html").read_text(encoding="utf-8"), "html.parser")
    missing = []
    for field in FIELDS:
        if field.get("virtual"):
            continue
        found = soup.select(field["sel"])
        index = field.get("nth", 0)
        if index >= len(found):
            missing.append(field["key"])
            continue
        field["def"] = to_text(found[index], field)
    if missing:
        raise SystemExit(f"حقول لم تُعثر عناصرها في index.html: {missing}")
    body = json.dumps({"fields": FIELDS, "projects": PROJECTS}, ensure_ascii=False, indent=1)
    (ROOT / "schema.js").write_text(
        "// مولَّد من tools/build_schema.py — لا تعدّله يدوياً.\n"
        f"window.AXIS_SCHEMA={body};\n", encoding="utf-8")
    print(f"schema.js: {len(FIELDS)} حقلاً، {len(PROJECTS)} مشروعاً افتراضياً")


if __name__ == "__main__":
    main()
