(function () {
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }

  function isTeacherOnly() {
    const role = String(getUser().role || "").toLowerCase();
    return role === "teacher";
  }

  if (!isTeacherOnly()) return;

  const style = document.createElement("style");
  style.innerHTML = `
    .teacher-no-print,
    .print-report-btn,
    .teacher-print-report-btn,
    button[onclick*="print"],
    a[onclick*="print"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  function removePrintButtons() {
    document.querySelectorAll("button, a").forEach(el => {
      const text = String(el.textContent || "").trim().toLowerCase();

      if (
        text === "print" ||
        text === "print report" ||
        text.includes("print report")
      ) {
        el.classList.add("teacher-no-print");
        el.style.display = "none";
      }

      if (text.includes("view / print")) {
        el.textContent = "View";
      }
    });
  }

  document.addEventListener("click", function (event) {
    const btn = event.target.closest("button, a");
    if (!btn) return;

    const text = String(btn.textContent || "").trim().toLowerCase();

    if (
      text === "print" ||
      text === "print report" ||
      text.includes("print report")
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      alert("Teachers can view reports only. Printing is allowed from the Parent account.");
      return false;
    }
  }, true);

  document.addEventListener("DOMContentLoaded", removePrintButtons);

  const observer = new MutationObserver(removePrintButtons);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  removePrintButtons();
})();
