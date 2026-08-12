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

function initMobileHeaderToggle() {
  const headers = Array.from(document.querySelectorAll("header.navbar, header.main-header, header.public-header"));

  if (headers.length === 0) return;

  const mobileQuery = window.matchMedia("(max-width: 768px)");

  function findDirectNav(parent) {
    const children = Array.from(parent.children || []);
    return children.find((child) => child.tagName && child.tagName.toLowerCase() === "nav") || null;
  }

  headers.forEach((header) => {
    const nav =
      findDirectNav(header) ||
      findDirectNav(header.querySelector(".header-container") || {}) ||
      header.querySelector(".main-nav") ||
      header.querySelector("nav");

    if (!nav) return;

    if (header.querySelector(".mobile-header-toggle")) return;

    header.classList.add("mobile-header-collapsible");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobile-header-toggle";
    button.setAttribute("aria-label", "Toggle header menu");
    button.setAttribute("aria-expanded", "false");

    const setIcon = (collapsed) => {
      button.textContent = collapsed ? "\u25BC" : "\u25B2";
      button.setAttribute("aria-expanded", collapsed ? "false" : "true");
    };

    const applyStateByViewport = () => {
      if (mobileQuery.matches) {
        if (!header.classList.contains("mobile-header-collapsed") && !header.dataset.menuOpened) {
          header.classList.add("mobile-header-collapsed");
        }
      } else {
        header.classList.remove("mobile-header-collapsed");
        delete header.dataset.menuOpened;
      }

      setIcon(header.classList.contains("mobile-header-collapsed"));
    };

    button.addEventListener("click", () => {
      const isCollapsed = header.classList.toggle("mobile-header-collapsed");
      if (!isCollapsed) {
        header.dataset.menuOpened = "1";
      }
      setIcon(isCollapsed);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (!mobileQuery.matches) return;
        header.classList.add("mobile-header-collapsed");
        setIcon(true);
      });
    });

    const container = header.querySelector(".header-container") || header;
    if (container === header) {
      header.insertBefore(button, nav);
    } else {
      container.insertBefore(button, nav);
    }

    applyStateByViewport();
    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", applyStateByViewport);
    } else if (typeof mobileQuery.addListener === "function") {
      mobileQuery.addListener(applyStateByViewport);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    loadSchoolHeaderSettings();
    initMobileHeaderToggle();
  });
} else {
  loadSchoolHeaderSettings();
  initMobileHeaderToggle();
}
