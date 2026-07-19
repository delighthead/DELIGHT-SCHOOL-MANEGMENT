document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  if (!token || !user || user.role !== "teacher") {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "../pages/login.html";
    return;
  }

  const restrictedPages = ["teacher-reports.html", "fees.html", "reports.html"];
  const currentPage = (window.location.pathname.split("/").pop() || "").toLowerCase();

  if (restrictedPages.includes(currentPage)) {
    alert("Teachers are not allowed to view reports or fees.");
    window.location.href = "teacher.html";
    return;
  }

  // Hide restricted navigation links from teacher sidebar.
  document.querySelectorAll('a[href="teacher-reports.html"], a[href="fees.html"], a[href="reports.html"]').forEach(link => {
    link.style.display = "none";
  });

  // Disable print entry points for teacher pages.
  window.print = function () {
    alert("Printing is not allowed for teacher accounts.");
  };

  window.addEventListener("beforeprint", function (event) {
    event.preventDefault();
    alert("Printing is not allowed for teacher accounts.");
  });
});
