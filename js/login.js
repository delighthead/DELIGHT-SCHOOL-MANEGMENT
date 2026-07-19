document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  function getApiBases() {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return [""];
    }

    const protocol = window.location.protocol === "http:" ? "http:" : "https:";
    return ["", `${protocol}//${host}:5000`];
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

  if (!loginForm) return;

  async function tryLoginWithFallback(payload) {
    let lastErrorMessage = "Login failed";

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
        let data = {};

        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const rawText = await response.text();
          lastErrorMessage = rawText || `Login failed (${response.status})`;
          continue;
        }

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
    const username = document
      .getElementById("username")
      .value
      .trim()
      .toUpperCase();
    const password = document.getElementById("password").value.trim();

    if (!role || !username || !password) {
      showMessage("Please fill all login fields.", true);
      return;
    }

    clearOldLoginData();

    try {
      const result = await tryLoginWithFallback({
        role,
        username,
        password
      });

      if (!result.ok) {
        showMessage(result.message || "Login failed", true);
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
    } catch (error) {
      console.error(error);
      showMessage("Cannot connect to backend.", true);
    }
  });
});
