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
    ("teacher.html", "Dashboard Overview", "teacher.html"),
    ("teacher-profile.html", "My Profile", "teacher-profile.html"),
    ("teacher-class.html", "Assigned Class", "teacher-class.html"),
    ("teacher-students.html", "Students", "teacher-students.html"),
    ("teacher-scores.html", "Scores & Uploads", "teacher-scores.html"),
    ("teacher-attendance.html", "Mark Attendance", "teacher-attendance.html"),
    ("teacher-announcements.html", "Announcements", "teacher-announcements.html"),
    ("teacher-reports.html", "Reports", "teacher-reports.html"),
    ("../pages/login.html", "Logout", ""),
]

sidebar = '    <aside class="sidebar">\n'
sidebar += '      <h2>Teacher Panel</h2>\n'

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

print(f"Updated teacher sidebar: {file_path}")
PY
}

update_sidebar "dashboard/teacher.html" "teacher.html"
update_sidebar "dashboard/teacher-profile.html" "teacher-profile.html"
update_sidebar "dashboard/teacher-class.html" "teacher-class.html"
update_sidebar "dashboard/teacher-students.html" "teacher-students.html"
update_sidebar "dashboard/teacher-scores.html" "teacher-scores.html"
update_sidebar "dashboard/teacher-attendance.html" "teacher-attendance.html"
update_sidebar "dashboard/teacher-announcements.html" "teacher-announcements.html"
update_sidebar "dashboard/teacher-reports.html" "teacher-reports.html"

echo "All teacher sidebars updated with Students page."
