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
    ("parent.html", "Dashboard Overview", "parent.html"),
    ("parent-child-profile.html", "Child Profile", "parent-child-profile.html"),
    ("parent-results.html", "Scores & Results", "parent-results.html"),
    ("parent-fees.html", "Fees Status", "parent-fees.html"),
    ("parent-attendance.html", "Attendance", "parent-attendance.html"),
    ("parent-announcements.html", "Announcements", "parent-announcements.html"),
    ("parent-reports.html", "Reports", "parent-reports.html"),
    ("../pages/login.html", "Logout", ""),
]

sidebar = '    <aside class="sidebar">\n'
sidebar += '      <h2>Parent Panel</h2>\n'

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

print(f"Updated parent sidebar: {file_path}")
PY
}

update_sidebar "dashboard/parent.html" "parent.html"
update_sidebar "dashboard/parent-child-profile.html" "parent-child-profile.html"
update_sidebar "dashboard/parent-results.html" "parent-results.html"
update_sidebar "dashboard/parent-fees.html" "parent-fees.html"
update_sidebar "dashboard/parent-attendance.html" "parent-attendance.html"
update_sidebar "dashboard/parent-announcements.html" "parent-announcements.html"
update_sidebar "dashboard/parent-reports.html" "parent-reports.html"

echo "All parent sidebars updated with Child Profile."
