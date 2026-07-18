document.addEventListener("DOMContentLoaded", function () {
  const style = document.createElement("style");

  style.innerHTML = `
    .print-single-attendance-btn {
      background: #111827 !important;
      color: #ffffff !important;
      border: none !important;
      padding: 8px 14px !important;
      border-radius: 6px !important;
      font-weight: bold !important;
      cursor: pointer !important;
      opacity: 1 !important;
    }

    .print-single-attendance-btn:hover {
      background: #4b0000 !important;
      color: #ffffff !important;
    }
  `;

  document.head.appendChild(style);
});
