document.addEventListener("DOMContentLoaded", function () {
  const childProfileArea = document.getElementById("childProfileArea");

  async function getLoggedInParent() {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      throw new Error("No logged-in user found. Please login again.");
    }

    const user = JSON.parse(storedUser);

    if (user.role !== "parent") {
      throw new Error("This page is for parents only.");
    }

    const response = await fetch(`http://127.0.0.1:5000/api/parents/by-user/${user.id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Parent account not found.");
    }

    return data.parent;
  }

  async function loadChildProfile() {
    if (!childProfileArea) return;

    try {
      const parent = await getLoggedInParent();

      const response = await fetch(`http://127.0.0.1:5000/api/parents/${parent.id}/children`);
      const data = await response.json();

      if (!response.ok) {
        childProfileArea.innerHTML = `<p>${data.message || "Could not load child profile."}</p>`;
        return;
      }

      if (!data.children || data.children.length === 0) {
        childProfileArea.innerHTML = `<p>No child linked to this parent account.</p>`;
        return;
      }

      const child = data.children[0];

      childProfileArea.innerHTML = `
        <section class="dashboard-section">
          <h2>Student Profile Summary</h2>

          <div class="profile-box">
            <div class="profile-photo">
              Student Photo
            </div>

            <div class="profile-details">
              <h3>${child.full_name || ""}</h3>
              <p><strong>Admission Number:</strong> ${child.admission_number || ""}</p>
              <p><strong>Branch:</strong> ${child.branch_name || ""}</p>
              <p><strong>Class:</strong> ${child.class_name || ""}</p>
              <p><strong>Status:</strong> ${child.status || ""}</p>
            </div>
          </div>
        </section>

        <section class="dashboard-section">
          <h2>Personal Information</h2>

          <div class="info-grid">
            <div class="info-item">
              <strong>Full Name</strong>
              <span>${child.full_name || ""}</span>
            </div>

            <div class="info-item">
              <strong>Sex</strong>
              <span>${child.sex || ""}</span>
            </div>

            <div class="info-item">
              <strong>Date of Birth</strong>
              <span>${child.date_of_birth ? child.date_of_birth.slice(0, 10) : ""}</span>
            </div>

            <div class="info-item">
              <strong>Place of Birth</strong>
              <span>${child.place_of_birth || ""}</span>
            </div>

            <div class="info-item">
              <strong>Nationality</strong>
              <span>${child.nationality || ""}</span>
            </div>

            <div class="info-item">
              <strong>Language Spoken</strong>
              <span>${child.language_spoken || ""}</span>
            </div>

            <div class="info-item">
              <strong>Branch</strong>
              <span>${child.branch_name || ""}</span>
            </div>

            <div class="info-item">
              <strong>Class</strong>
              <span>${child.class_name || ""}</span>
            </div>
          </div>
        </section>

        <section class="dashboard-section">
          <h2>Parent / Guardian Information</h2>

          <div class="info-grid">
            <div class="info-item">
              <strong>Logged-in Parent</strong>
              <span>${parent.full_name || ""}</span>
            </div>

            <div class="info-item">
              <strong>Parent Ghana Card</strong>
              <span>${parent.ghana_card_number || ""}</span>
            </div>

            <div class="info-item">
              <strong>Parent Phone</strong>
              <span>${parent.phone || ""}</span>
            </div>

            <div class="info-item">
              <strong>Parent Branch</strong>
              <span>${parent.branch_name || ""}</span>
            </div>

            <div class="info-item">
              <strong>Mother's Name</strong>
              <span>${child.mother_name || ""}</span>
            </div>

            <div class="info-item">
              <strong>Father's Name</strong>
              <span>${child.father_name || ""}</span>
            </div>
          </div>
        </section>
      `;
    } catch (error) {
      console.error(error);
      childProfileArea.innerHTML = `<p>${error.message}</p>`;
    }
  }

  loadChildProfile();
});


