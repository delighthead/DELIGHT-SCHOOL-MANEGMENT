#!/bin/bash

update_sidebar() {
  file="$1"
  active="$2"

  if [ ! -f "$file" ]; then
    echo "Skipping missing file: $file"
    return
  fi

  python3 - "$file" "$active" <<'PY'
import sys
import re

file_path = sys.argv[1]
active_page = sys.argv[2]

links = [
    ("../index.html", "Website Home", ""),
    ("admin.html", "Dashboard Overview", "admin.html"),
    ("students.html", "Add / Manage Students", "students.html"),
    ("scores.html", "Scores and Results", "scores.html"),
    ("fees.html", "Fees Management", "fees.html"),
    ("attendance.html", "Attendance", "attendance.html"),
    ("announcements.html", "Announcements", "announcements.html"),
    ("reports.html", "Reports", "reports.html"),
    ("settings.html", "System Settings", "settings.html"),
    ("edit-pages.html", "Edit Website Pages", "edit-pages.html"),
    ("teachers.html", "Add / Assign Teachers", "teachers.html"),
    ("parents.html", "Add Parents", "parents.html"),
    ("accounts.html", "Lock / Disable Accounts", "accounts.html"),
    ("activities.html", "Recent Activities", "activities.html"),
    ("../pages/login.html", "Logout", ""),
]

sidebar = '    <aside class="sidebar">\n'
sidebar += '      <h2>Admin Panel</h2>\n'

for href, text, page in links:
    active_class = ' class="active"' if page == active_page else ''
    sidebar += f'      <a href="{href}"{active_class}>{text}</a>\n'

sidebar += '    </aside>'

with open(file_path, "r", encoding="utf-8") as f:
    html = f.read()

new_html = re.sub(
    r'    <aside class="sidebar">.*?</aside>',
    sidebar,
    html,
    flags=re.DOTALL
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_html)

print(f"Updated admin sidebar: {file_path}")
PY
}

update_sidebar "dashboard/admin.html" "admin.html"
update_sidebar "dashboard/students.html" "students.html"
update_sidebar "dashboard/scores.html" "scores.html"
update_sidebar "dashboard/fees.html" "fees.html"
update_sidebar "dashboard/attendance.html" "attendance.html"
update_sidebar "dashboard/announcements.html" "announcements.html"
update_sidebar "dashboard/reports.html" "reports.html"
update_sidebar "dashboard/settings.html" "settings.html"
update_sidebar "dashboard/edit-pages.html" "edit-pages.html"
update_sidebar "dashboard/teachers.html" "teachers.html"
update_sidebar "dashboard/parents.html" "parents.html"
update_sidebar "dashboard/accounts.html" "accounts.html"
update_sidebar "dashboard/activities.html" "activities.html"

echo "All admin sidebars updated with System Settings."
