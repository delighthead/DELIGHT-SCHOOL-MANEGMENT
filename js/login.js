document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  function showMessage(message, isError = false) {
    if (!loginMessage) return;
    loginMessage.textContent = message;
    loginMessage.style.color = isError ? "red" : "green";
  }

  function clearOldLoginData() {
    localStorage.clear();
    sessionStorage.clear();
  }

  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const role = document.getElementById("role").value;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!role || !username || !password) {
      showMessage("Please fill all login fields.", true);
      return;
    }

    clearOldLoginData();

    try {
      const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role,
          username,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || "Login failed", true);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showMessage("Login successful. Redirecting...");

      setTimeout(function () {
        if (data.user.role === "teacher") {
          window.location.href = "../dashboard/teacher.html";
        } else if (data.user.role === "parent") {
          window.location.href = "../dashboard/parent.html";
        } else {
          window.location.href = "../dashboard/admin.html";
        }
      }, 500);
    } catch (error) {
      console.error(error);
      showMessage("Cannot connect to backend.", true);
    }
  });
});
