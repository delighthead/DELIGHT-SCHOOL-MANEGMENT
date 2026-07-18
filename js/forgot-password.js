document.addEventListener("DOMContentLoaded", function () {
  const verifyForm = document.getElementById("forgotVerifyForm");
  const resetForm = document.getElementById("forgotResetForm");
  const messageBox = document.getElementById("forgotMessage");

  function showMessage(message, isError = false) {
    messageBox.textContent = message;
    messageBox.style.color = isError ? "red" : "green";
  }

  verifyForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const payload = {
      role: document.getElementById("forgot_role").value,
      username: document.getElementById("forgot_username").value.trim(),
      phone: document.getElementById("forgot_phone").value.trim()
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/api/auth/forgot-password/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || "Verification failed", true);
        return;
      }

      document.getElementById("forgot_user_id").value = data.user_id;
      resetForm.style.display = "block";

      showMessage(`Account verified for ${data.full_name}. Enter a new password.`);
    } catch (error) {
      console.error(error);
      showMessage("Cannot connect to backend.", true);
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
      const response = await fetch("http://127.0.0.1:5000/api/auth/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || "Password reset failed", true);
        return;
      }

      showMessage(data.message);

      setTimeout(function () {
        window.location.href = "login.html";
      }, 1500);
    } catch (error) {
      console.error(error);
      showMessage("Cannot connect to backend.", true);
    }
  });
});
