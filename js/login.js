document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const INVALID_LOGIN_MESSAGE = "The selected role, Ghana Card, or Password is incorrect.";

  function getApiBases() {
    const host = window.location.hostname;

    if (host === "localhost" || host === "127.0.0.1") {
      return ["http://localhost:5000", "http://127.0.0.1:5000"];
    }

    return [
      "https://delightintschool.com",
      "https://www.delightintschool.com",
      `${window.location.protocol}//${host}`
    ];
  }

  const API_BASES = getApiBases();

  function showMessage(message, isError = false) {
    if (!loginMessage) return;
    loginMessage.textContent = message;
    loginMessage.style.color = isError ? "red" : "green";
  }

  function clearOldLoginData() {
    localStorage.clear();
    sessionStorage.clear();
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (event) {
      event.preventDefault();
      showMessage("Contact the school admin.", true);
    });
  }

  if (!loginForm) return;

  async function tryLoginWithFallback(payload) {
    let lastErrorMessage = "Cannot connect to backend.";

    for (const apiBase of API_BASES) {
      try {
        const response = await fetch(`${apiBase}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const contentType = (response.headers.get("content-type") || "").toLowerCase();

        if (!contentType.includes("application/json")) {
          lastErrorMessage = `Backend returned invalid response from ${apiBase}`;
          continue;
        }

        const data = await response.json();

        if (!response.ok) {
          lastErrorMessage = data.message || "Login failed";
          continue;
        }

        return { ok: true, data };
      } catch (error) {
        lastErrorMessage = "Cannot connect to backend.";
      }
    }

    return { ok: false, message: lastErrorMessage };
  }

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const role = document.getElementById("role").value;
    const username = document.getElementById("username").value.trim().toUpperCase();
    const password = document.getElementById("password").value.trim();

    if (!role || !username || !password) {
      showMessage("Please fill all login fields.", true);
      return;
    }

    clearOldLoginData();

    const result = await tryLoginWithFallback({
      role,
      username,
      password
    });

    if (!result.ok) {
      const normalizedMessage = String(result.message || "").toLowerCase();
      const isInvalidCredentials =
        normalizedMessage.includes("invalid login details") ||
        normalizedMessage.includes("incorrect password") ||
        normalizedMessage.includes("invalid credentials") ||
        normalizedMessage.includes("wrong password");

      showMessage(isInvalidCredentials ? INVALID_LOGIN_MESSAGE : result.message, true);
      return;
    }

    const data = result.data;

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
  });
});
