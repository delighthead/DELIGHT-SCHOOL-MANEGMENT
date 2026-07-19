document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("printAttendanceBtn");

  if (!btn) return;

  btn.onclick = function (event) {
    event.preventDefault();
    event.stopPropagation();
    window.print();
    return false;
  };
});
