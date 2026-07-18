document.addEventListener("DOMContentLoaded", function () {
  function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("branch_id");

    sessionStorage.clear();

    window.location.href = "../pages/login.html";
  }

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.type = "button";
    logoutBtn.onclick = function (event) {
      event.preventDefault();
      logoutUser();
    };
  }

  document.querySelectorAll("button, a").forEach(function (el) {
    const text = (el.textContent || "").trim().toLowerCase();

    if (text === "logout" || text === "log out") {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        logoutUser();
      });
    }
  });
});
