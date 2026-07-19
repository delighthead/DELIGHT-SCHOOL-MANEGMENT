document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  if (!token || !user || user.role !== "parent") {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "../pages/login.html";
  }
});
