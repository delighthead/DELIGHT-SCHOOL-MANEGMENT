document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const form =
    document.getElementById("editPageForm") ||
    document.querySelector("form");

  const pageSelect = document.getElementById("page_key");
  const loadBtn =
    document.getElementById("loadPageBtn") ||
    document.querySelector("button[type='button']");

  function token() {
    return localStorage.getItem("token") || "";
  }

  function authHeaders(json = false) {
    const h = {};
    if (json) h["Content-Type"] = "application/json";
    if (token()) h.Authorization = `Bearer ${token()}`;
    return h;
  }

  function value(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  }

  function getBlocksContainer() {
    let container =
      document.getElementById("pageBlocksContainer") ||
      document.getElementById("blocksContainer") ||
      document.getElementById("page_blocks_container") ||
      document.getElementById("allPageWritings") ||
      document.querySelector(".page-blocks-container");

    if (container) return container;

    const sections = Array.from(document.querySelectorAll("section, .dashboard-section, .card, div"));

    const writingsSection = sections.find(sec => {
      const h = sec.querySelector("h2, h3");
      return h && h.textContent.trim().toLowerCase().includes("all page writings");
    });

    if (writingsSection) {
      container = document.createElement("div");
      container.id = "pageBlocksContainer";
      writingsSection.appendChild(container);
      return container;
    }

    container = document.createElement("div");
    container.id = "pageBlocksContainer";
    container.style.marginTop = "20px";

    if (form && form.parentElement) {
      form.parentElement.appendChild(container);
    } else {
      document.body.appendChild(container);
    }

    return container;
  }

  function clearBlocks() {
    const container = getBlocksContainer();
    container.innerHTML = "";
    return container;
  }

  function shouldUseTextarea(block) {
    const type = String(block.block_type || "").toLowerCase();
    const key = String(block.block_key || "").toLowerCase();

    return (
      type === "textarea" ||
      key.includes("text") ||
      key.includes("intro") ||
      key.includes("content") ||
      key.includes("message") ||
      key.includes("notice")
    );
  }

  function renderBlocks(blocks) {
    const container = clearBlocks();

    if (!blocks || blocks.length === 0) {
      container.innerHTML = `<p>No page writings found for this page.</p>`;
      return;
    }

    blocks.forEach(block => {
      const wrapper = document.createElement("div");
      wrapper.className = "form-group page-block-wrapper";
      wrapper.style.marginBottom = "14px";

      const label = document.createElement("label");
      label.textContent = block.block_label || block.block_key || "Page Writing";
      label.style.fontWeight = "bold";

      let input;

      if (shouldUseTextarea(block)) {
        input = document.createElement("textarea");
        input.rows = 4;
      } else {
        input = document.createElement("input");
        input.type = "text";
      }

      input.className = "page-block-input";
      input.dataset.blockKey = block.block_key;
      input.value = block.block_content || "";
      input.style.width = "100%";

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      container.appendChild(wrapper);
    });
  }

  async function loadPage() {
    const pageKey = value("page_key");

    if (!pageKey) {
      alert("Please select a page.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/website-pages/${pageKey}`, {
        headers: authHeaders()
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load page.");
      }

      const page = data.page || {};
      const blocks = data.blocks || [];

      setValue("page_title", page.page_title || "");
      setValue("section_title", page.section_title || "");
      setValue("section_content", page.section_content || "");
      setValue("button_text", page.button_text || "");
      setValue("button_link", page.button_link || "");

      renderBlocks(blocks);
    } catch (error) {
      console.error("Load page error:", error);
      alert(error.message || "Could not load page.");
    }
  }

  async function updatePage(event) {
    if (event) event.preventDefault();

    const pageKey = value("page_key");

    if (!pageKey) {
      alert("Please select a page.");
      return;
    }

    const blocks = Array.from(document.querySelectorAll(".page-block-input")).map(input => ({
      block_key: input.dataset.blockKey,
      block_content: input.value
    }));

    try {
      const res1 = await fetch(`${API}/api/website-pages/${pageKey}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({
          page_title: value("page_title"),
          section_title: value("section_title"),
          section_content: value("section_content"),
          button_text: value("button_text"),
          button_link: value("button_link")
        })
      });

      const data1 = await res1.json();

      if (!res1.ok) {
        throw new Error(data1.message || "Failed to update main page content.");
      }

      const res2 = await fetch(`${API}/api/website-pages/${pageKey}/blocks`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ blocks })
      });

      const data2 = await res2.json();

      if (!res2.ok) {
        throw new Error(data2.message || "Failed to update page writings.");
      }

      alert("All page writings updated successfully.");

      await loadPage();
    } catch (error) {
      console.error("Update page error:", error);
      alert(error.message || "Could not update page.");
    }
  }

  if (loadBtn) {
    loadBtn.addEventListener("click", loadPage);
  }

  if (form) {
    form.addEventListener("submit", updatePage);
  }

  window.loadWebsitePageForEditing = loadPage;
});
