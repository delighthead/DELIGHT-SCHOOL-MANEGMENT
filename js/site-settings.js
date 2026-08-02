async function loadSchoolHeaderSettings() {
  const host = window.location.hostname;
  const API_BASE =
    host === "localhost" || host === "127.0.0.1"
      ? ""
      : "";
  const FIXED_LOGO_PATH = window.location.protocol === "file:"
    ? "images/delight_international_school_transparent.png?v=20260802"
    : "/images/delight_international_school_transparent.png?v=20260802";

  try {
    const response = await fetch(`${API_BASE}/api/settings`);
    const data = await response.json();

    if (!response.ok) return;

    const settings = data.settings || {};
    const schoolName = settings.school_name || "Delight International School";
    const logoUrl = FIXED_LOGO_PATH;

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
      wrapper.style.setProperty("color", "#ffffff", "important");

      const img = document.createElement("img");
      img.src = logoUrl;
      img.alt = "School Logo";
      img.className = "dynamic-school-logo";
      wrapper.appendChild(img);

      const span = document.createElement("span");
      span.textContent = schoolName;
      span.style.setProperty("color", "#ffffff", "important");
      wrapper.appendChild(span);

      return wrapper;
    }

    // Normal website header
    const logoBox = document.querySelector(".logo");

    if (logoBox) {
      logoBox.style.setProperty("color", "#ffffff", "important");
      logoBox.innerHTML = "";

      const img = document.createElement("img");
      img.src = logoUrl;
      img.alt = `${schoolName} logo`;
      logoBox.appendChild(img);

      const span = document.createElement("span");
      span.textContent = schoolName;
      span.className = "header-school-name";
      span.style.setProperty("color", "#ffffff", "important");
      logoBox.appendChild(span);
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
