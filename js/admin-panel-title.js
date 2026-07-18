document.addEventListener("DOMContentLoaded", function () {
  const userData = localStorage.getItem("user");
  const sidebarTitle = document.querySelector(".sidebar h2");

  if (!userData || !sidebarTitle) return;

  try {
    const user = JSON.parse(userData);

    if (user.role === "super_admin") {
      sidebarTitle.textContent = "Super Admin Panel";
    }

    else if (user.role === "branch_admin") {
      if (Number(user.branch_id) === 4) {
        sidebarTitle.textContent = "Kotobabi Admin Panel";
      } else if (Number(user.branch_id) === 5) {
        sidebarTitle.textContent = "Ofankor Admin Panel";
      } else {
        sidebarTitle.textContent = "Branch Admin Panel";
      }
    }

    else if (user.role === "admin") {
      sidebarTitle.textContent = "Admin Panel";
    }
  } catch (error) {
    console.error("Could not load admin panel title", error);
  }
});


