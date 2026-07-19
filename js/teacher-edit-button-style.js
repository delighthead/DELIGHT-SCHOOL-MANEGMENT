document.addEventListener("DOMContentLoaded", function () {
  const style = document.createElement("style");

  style.innerHTML = `
    .edit-teacher-btn {
      background: #0b4f8a !important;
      color: #ffffff !important;
      border: none !important;
      padding: 8px 14px !important;
      border-radius: 6px !important;
      font-weight: bold !important;
      cursor: pointer !important;
      opacity: 1 !important;
    }

    .edit-teacher-btn:hover {
      background: #073b70 !important;
      color: #ffffff !important;
    }
  `;

  document.head.appendChild(style);
});
