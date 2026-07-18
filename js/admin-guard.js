document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const allowedRoles = ["admin", "branch_admin", "super_admin"];

  if (!token || !user || !allowedRoles.includes(user.role)) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "../pages/login.html";
  }
});
