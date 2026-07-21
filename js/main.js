async function loginUser(event) {
  event.preventDefault();

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

        const data = await response.json();

        if (!response.ok) {
          lastErrorMessage = data.message || "Login failed";
          continue;
        }

        return { ok: true, data };
      } catch (error) {
        lastErrorMessage = "Cannot connect to backend server. Make sure backend is running on port 5000.";
      }
    }

    return { ok: false, message: lastErrorMessage };
  }

  const roleSelect = document.getElementById("role");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  const roleMap = {
    "School Admin": "admin",
    "Teacher": "teacher",
    "Parent": "parent"
  };

  const selectedRole = roleSelect.value;
  const role = roleMap[selectedRole];
  const username = usernameInput.value.trim().toUpperCase();
  const password = passwordInput.value.trim();

  if (!role || !username || !password) {
    alert("Please enter role, username, and password.");
    return;
  }

  try {
    const result = await tryLoginWithFallback({
      username,
      password,
      role
    });

    if (!result.ok) {
      alert(result.message || "Login failed");
      return;
    }

    const data = result.data;

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    if (
      data.user.role === "admin" ||
      data.user.role === "super_admin" ||
      data.user.role === "branch_admin"
    ) {
      window.location.href = "../dashboard/admin.html";
    } else if (data.user.role === "teacher") {
      window.location.href = "../dashboard/teacher.html";
    } else if (data.user.role === "parent") {
      window.location.href = "../dashboard/parent.html";
    } else {
      alert("Unknown user role");
    }
  } catch (error) {
    alert("Cannot connect to backend server. Make sure backend is running on port 5000.");
    console.error(error);
  }
}
