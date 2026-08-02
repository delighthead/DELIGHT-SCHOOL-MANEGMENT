async function loadSchoolHeaderSettings() {
  const host = window.location.hostname;
  const API_BASE =
    host === "localhost" || host === "127.0.0.1"
      ? ""
      : "";

  try {
    const response = await fetch(`${API_BASE}/api/settings`);
    const data = await response.json();

    if (!response.ok) return;

    const settings = data.settings || {};
    const schoolName = settings.school_name || "Delight International School";
    const logoPath = settings.school_logo;
    const logoUrl = logoPath ? `${API_BASE}${logoPath}` : "";

    document.querySelectorAll("[data-school-name], .school-name, #schoolNameText").forEach((el) => {
      el.textContent = schoolName;
    });

    document.querySelectorAll("[data-school-logo], .school-logo, #schoolLogoImage").forEach((el) => {
      if (el.tagName === "IMG") {
        if (logoUrl) {
          el.src = logoUrl;
        }
        el.alt = "School Logo";
      }
    });

    function buildLogoBrand() {
      const wrapper = document.createElement("div");
      wrapper.className = "dynamic-school-brand";

      if (logoUrl) {
        const img = document.createElement("img");
        img.src = logoUrl;
        img.alt = "School Logo";
        img.className = "dynamic-school-logo";
        wrapper.appendChild(img);
      }

      const span = document.createElement("span");
      span.textContent = schoolName;
      wrapper.appendChild(span);

      return wrapper;
    }

    // Normal website header
    const logoBox = document.querySelector(".logo");

    if (logoBox) {
      logoBox.innerHTML = "";
      logoBox.appendChild(buildLogoBrand());
    }

    // Dashboard/sidebar header
    const sidebar = document.querySelector(".sidebar");
    if (sidebar && !sidebar.querySelector(".dynamic-school-brand")) {
      const brand = buildLogoBrand();
      brand.classList.add("dashboard-school-brand");
      sidebar.insertBefore(brand, sidebar.firstChild);
    }

    document.title = schoolName;
  } catch (error) {
    console.error("Could not load school header settings:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadSchoolHeaderSettings);
} else {
  loadSchoolHeaderSettings();
}
