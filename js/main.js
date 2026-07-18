async function loginUser(event) {
  event.preventDefault();

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
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!role || !username || !password) {
    alert("Please enter role, username, and password.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password,
        role
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Login failed");
      return;
    }

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
