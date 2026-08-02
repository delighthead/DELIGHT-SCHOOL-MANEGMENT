document.addEventListener("DOMContentLoaded", function () {
  const API = "";

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
        if (page.button_link) btn.href = page.button_link;
      }
    } catch (error) {
      console.error("Public page content load error:", error);
    }
  }

  loadPageContent();
});
