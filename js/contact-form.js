document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  const form =
    document.getElementById("contactForm") ||
    document.querySelector("form");

  if (!form) return;

  function findInput(labelWords) {
    const fields = Array.from(form.querySelectorAll("input, textarea"));

    return fields.find(field => {
      const id = (field.id || "").toLowerCase();
      const name = (field.name || "").toLowerCase();
      const placeholder = (field.placeholder || "").toLowerCase();

      return labelWords.some(word =>
        id.includes(word) ||
        name.includes(word) ||
        placeholder.includes(word)
      );
    });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const fullNameInput = findInput(["full", "name"]);
    const emailInput = findInput(["email"]);
    const phoneInput = findInput(["phone"]);
    const subjectInput = findInput(["subject"]);
    const messageInput = findInput(["message"]);

    const payload = {
      full_name: fullNameInput ? fullNameInput.value.trim() : "",
      email: emailInput ? emailInput.value.trim() : "",
      phone: phoneInput ? phoneInput.value.trim() : "",
      subject: subjectInput ? subjectInput.value.trim() : "",
      message: messageInput ? messageInput.value.trim() : ""
    };

    if (!payload.full_name || !payload.email || !payload.message) {
      alert("Please enter your full name, email, and message.");
      return;
    }

    const btn = form.querySelector("button[type='submit'], input[type='submit']");

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending...";
    }

    try {
      const res = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send message.");
      }

      alert("Message sent successfully. Thank you for contacting Delight International School.");
      form.reset();
    } catch (error) {
      alert(error.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Send Message";
      }
    }
  });
});
