document.addEventListener("DOMContentLoaded", function () {
  const parentChildBox = document.getElementById("parentChildBox");

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  function formatDate(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  function safe(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function loadParentChildren() {
    if (!parentChildBox) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/api/parents/my/children", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      parentChildBox.innerHTML = "";

      if (!response.ok) {
        parentChildBox.innerHTML = `<div class="dashboard-card"><h2>Access Error</h2><p>${data.message || "Could not load children."}</p></div>`;
        return;
      }

      const children = data.children || [];

      if (children.length === 0) {
        parentChildBox.innerHTML = `<div class="dashboard-card"><h2>No Active Children</h2><p>No active child is linked to this parent account.</p></div>`;
        return;
      }

      children.forEach(function (child) {
        const photoUrl = child.profile_picture
          ? `http://127.0.0.1:5000${child.profile_picture}`
          : "";

        const card = document.createElement("div");
        card.className = "dashboard-card";
        card.style.width = "430px";
        card.style.maxWidth = "430px";
        card.style.minHeight = "230px";
        card.style.flex = "0 0 430px";

        card.innerHTML = `
          <div style="display:flex; gap:20px; align-items:center; width:100%;">
            ${
              photoUrl
                ? `<img src="${photoUrl}" alt="Student Photo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">`
                : `<div style="width:80px;height:80px;border-radius:50%;background:#003b70;color:#ffcc00;display:flex;align-items:center;justify-content:center;font-weight:bold;">Photo</div>`
            }

            <div style="flex:1; min-width:220px;">
              <h2 style="margin-bottom:10px;">${safe(child.full_name)}</h2>
              <p><strong>Student ID:</strong> ${safe(child.student_id)}</p>
              <p><strong>Admission No:</strong> ${safe(child.admission_number)}</p>
              <p><strong>Branch:</strong> ${safe(child.branch_name)}</p>
              <p><strong>Class:</strong> ${safe(child.class_name)}</p>
              <p><strong>Sex:</strong> ${safe(child.sex)}</p>
              <p><strong>Date of Birth:</strong> ${safe(formatDate(child.date_of_birth))}</p>
              <p><strong>Place of Birth:</strong> ${safe(child.place_of_birth)}</p>
              <p><strong>Nationality:</strong> ${safe(child.nationality)}</p>
              <p><strong>Language:</strong> ${safe(child.language_spoken)}</p>
              <p><strong>Status:</strong> ${safe(child.status)}</p>
              <p><strong>Relationship:</strong> ${safe(child.relationship)}</p>
              <p><strong>Mother:</strong> ${safe(child.mother_name)} (${safe(child.mother_phone)})</p>
              <p><strong>Father:</strong> ${safe(child.father_name)} (${safe(child.father_phone)})</p>
            </div>
          </div>
        `;

        parentChildBox.appendChild(card);
      });
    } catch (error) {
      console.error(error);
      parentChildBox.innerHTML = `<div class="dashboard-card"><h2>Connection Error</h2><p>Cannot connect to backend.</p></div>`;
    }
  }

  loadParentChildren();
});


