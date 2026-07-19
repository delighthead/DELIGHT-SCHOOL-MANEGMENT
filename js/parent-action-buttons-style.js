document.addEventListener("DOMContentLoaded", function () {
  const style = document.createElement("style");

  style.innerHTML = `
    .edit-parent-btn {
      background: #0b4f8a !important;
      color: #ffffff !important;
      border: none !important;
      padding: 8px 14px !important;
      border-radius: 6px !important;
      font-weight: bold !important;
      cursor: pointer !important;
      opacity: 1 !important;
    }

    .toggle-parent-status-btn.danger,
    .toggle-parent-status-btn[data-status="disabled"] {
      background: #4b0000 !important;
      color: #ffffff !important;
      border: none !important;
      padding: 8px 14px !important;
      border-radius: 6px !important;
      font-weight: bold !important;
      cursor: pointer !important;
    }

    .toggle-parent-status-btn.success,
    .toggle-parent-status-btn[data-status="active"] {
      background: #16a34a !important;
      color: #ffffff !important;
      border: none !important;
      padding: 8px 14px !important;
      border-radius: 6px !important;
      font-weight: bold !important;
      cursor: pointer !important;
    }
  `;

  document.head.appendChild(style);
});
