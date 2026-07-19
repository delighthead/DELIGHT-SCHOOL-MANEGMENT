document.addEventListener("DOMContentLoaded", function () {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) {
    alert("Your login session has expired. Please login again.");
    window.location.href = "../pages/login.html";
    return;
  }
});
