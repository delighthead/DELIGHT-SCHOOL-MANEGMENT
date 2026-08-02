document.addEventListener("DOMContentLoaded", function () {
  const API = "";
  const ADMISSION_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe0gID4VYQBk6m1ZTvgodypO1bKIYs1m43R22ueAxqXClhK4Q/viewform?usp=header";

  function getPageKey() {
    const file = location.pathname.split("/").pop() || "index.html";

    if (file === "index.html" || file === "") return "home";
    if (file.includes("about")) return "about";
    if (file.includes("admission")) return "admission";
    if (file.includes("events")) return "events";
    if (file.includes("gallery")) return "gallery";
    if (file.includes("contact")) return "contact";

    return "";
  }

  async function loadPageContent() {
    const pageKey = getPageKey();
    if (!pageKey) return;

    const forceAdmissionButtonLink = () => {
      if (pageKey !== "home" && pageKey !== "admission") return;

      const btn = document.querySelector("[data-page-button]");
      if (!btn) return;

      btn.href = ADMISSION_FORM_URL;
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
    };

    // Apply immediately in case content API is unavailable.
    forceAdmissionButtonLink();

    try {
      const res = await fetch(`${API}/api/website-pages/${pageKey}`);
      const data = await res.json();

      if (!res.ok) return;

      const page = data.page || {};
      const blocks = data.blocks || [];

      if (page.page_title) document.title = page.page_title;

      document.querySelectorAll("[data-page-title]").forEach((el) => {
        if (page.page_title) {
          el.textContent = page.page_title;
        }
      });

      document.querySelectorAll("[data-section-title]").forEach((el) => {
        if (page.section_title) {
          el.textContent = page.section_title;
        }
      });

      document.querySelectorAll("[data-section-content]").forEach((el) => {
        if (page.section_content) {
          el.textContent = page.section_content;
        }
      });

      blocks.forEach(block => {
        const el = document.querySelector(`[data-edit-key="${block.block_key}"]`);

        if (el) {
          el.textContent = block.block_content || "";
        }
      });

      const btn = document.querySelector("[data-page-button]");
      if (btn) {
        if (page.button_text) btn.textContent = page.button_text;
        if (page.button_link && pageKey !== "home" && pageKey !== "admission") {
          btn.href = page.button_link;
        }
      }

      // Enforce required Google Form link for Home and Admission buttons.
      forceAdmissionButtonLink();
    } catch (error) {
      console.error("Public page content load error:", error);

      // Keep the required button link even if API request fails.
      forceAdmissionButtonLink();
    }
  }

  loadPageContent();
});
