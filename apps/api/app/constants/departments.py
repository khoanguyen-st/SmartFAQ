"""Department contact information constants."""

from typing import Dict, TypedDict


class DepartmentContact(TypedDict):
    name_vi: str
    name_en: str
    phone: str
    email: str


DEPARTMENT_CONTACTS: Dict[int, DepartmentContact] = {
    1: {
        "name_vi": "Phòng Công tác Sinh viên",
        "name_en": "Student Affairs Office",
        "phone": "02367.305.767",
        "email": "sro.gre.dn@fe.edu.vn",
    },
    2: {
        "name_vi": "Phòng Tổ chức - Đào tạo",
        "name_en": "Academic Administration Office",
        "phone": "02367.305.767",
        "email": "acad.gre.dn@fe.edu.vn",
    },
}

DEFAULT_CONTACT_VI = "bộ phận tư vấn để được hỗ trợ chi tiết hơn"
DEFAULT_CONTACT_EN = "consulting department for further assistance"


def get_department_contact_info(dept_id: int | None, language: str = "vi") -> str:
    """Get formatted contact information for a department."""
    if dept_id is None or dept_id not in DEPARTMENT_CONTACTS:
        return DEFAULT_CONTACT_VI if language == "vi" else DEFAULT_CONTACT_EN

    dept = DEPARTMENT_CONTACTS[dept_id]

    if language == "vi":
        return f"{dept['name_vi']}: Điện thoại: {dept['phone']}, Email: {dept['email']}"
    else:
        return f"{dept['name_en']}:\nPhone: {dept['phone']}, Email: {dept['email']}"


def get_all_contacts_footer(language: str = "vi") -> str:
    """Get formatted footer with all department contacts."""
    if language == "vi":
        lines = ["\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "📞 THÔNG TIN LIÊN HỆ:", ""]
        for dept in DEPARTMENT_CONTACTS.values():
            lines.append(f"• {dept['name_vi']}")
            lines.append(f"  Điện thoại: {dept['phone']}")
            lines.append(f"  Email: {dept['email']}")
            lines.append("")
        return "\n".join(lines)
    else:
        lines = ["\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "📞 CONTACT INFORMATION:", ""]
        for dept in DEPARTMENT_CONTACTS.values():
            lines.append(f"• {dept['name_en']}")
            lines.append(f"  Phone: {dept['phone']}")
            lines.append(f"  Email: {dept['email']}")
            lines.append("")
        return "\n".join(lines)


__all__ = [
    "DEPARTMENT_CONTACTS",
    "DEFAULT_CONTACT_VI",
    "DEFAULT_CONTACT_EN",
    "get_department_contact_info",
    "get_all_contacts_footer",
]
