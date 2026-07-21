document.addEventListener("DOMContentLoaded", function () {
  const verifyForm = document.getElementById("forgotVerifyForm");
  const resetForm = document.getElementById("forgotResetForm");
  const messageBox = document.getElementById("forgotMessage");

  function getApiBases() {
    const host = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const altProtocol = protocol === "https:" ? "http:" : "https:";
    const bases = ["", `${protocol}//${host}:5000`];

    if (host === "localhost" || host === "127.0.0.1") {
      bases.push("http://localhost:5000", "http://127.0.0.1:5000");
    } else {
      bases.push(`${altProtocol}//${host}:5000`);
    }

    return [...new Set(bases)];
  }

  const API_BASES = getApiBases();

  function showMessage(message, isError = false) {
    messageBox.textContent = message;
    messageBox.style.color = isError ? "red" : "green";
  }

  async function postWithFallback(path, payload) {
    let lastError = "Cannot connect to backend.";

    for (const apiBase of API_BASES) {
      try {
        const response = await fetch(`${apiBase}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        return { response, data };
      } catch (error) {
        lastError = "Cannot connect to backend.";
      }
    }

    throw new Error(lastError);
  }

  verifyForm.addEventListener("submit", async function (event) {
    event.preventDefault();

      const payload = {
      role: document.getElementById("forgot_role").value,
        username: document.getElementById("forgot_username").value.trim().toUpperCase(),
      phone: document.getElementById("forgot_phone").value.trim()
    };

    try {
      const { response, data } = await postWithFallback("/api/auth/forgot-password/verify", payload);

      if (!response.ok) {
        showMessage(data.message || "Verification failed", true);
        alert("Contact the school admin.");
        return;
      }

      document.getElementById("forgot_user_id").value = data.user_id;
      resetForm.style.display = "block";

      showMessage(`Account verified for ${data.full_name}. Enter a new password.`);
    } catch (error) {
      console.error(error);
      showMessage("Cannot connect to backend.", true);
      alert("Contact the school admin.");
    }
  });

  resetForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const payload = {
      user_id: document.getElementById("forgot_user_id").value,
      new_password: document.getElementById("new_password").value,
      confirm_password: document.getElementById("confirm_password").value
    };

    try {
      const { response, data } = await postWithFallback("/api/auth/forgot-password/reset", payload);

      if (!response.ok) {
        showMessage(data.message || "Password reset failed", true);
        alert("Contact the school admin.");
        return;
      }

      showMessage(data.message);

      setTimeout(function () {
        window.location.href = "login.html";
      }, 1500);
    } catch (error) {
      console.error(error);
      showMessage("Cannot connect to backend.", true);
      alert("Contact the school admin.");
    }
  });
});
