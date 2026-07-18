document.addEventListener("DOMContentLoaded", function () {
  const sidebarTitle = document.querySelector(".sidebar h2");

  if (!sidebarTitle) return;

  const storedUser = localStorage.getItem("user");

  if (!storedUser) return;

  try {
    const user = JSON.parse(storedUser);

    if (user.role === "teacher") {
      sidebarTitle.textContent = `${user.full_name}'s Panel`;
      return;
    }

    if (user.role === "parent") {
      sidebarTitle.textContent = `${user.full_name}'s Panel`;
      return;
    }

    if (user.role === "super_admin") {
      sidebarTitle.textContent = "Super Admin Panel";
      return;
    }

    if (user.role === "branch_admin") {
      const branchName = localStorage.getItem("branch_name");

      if (branchName) {
        sidebarTitle.textContent = `${branchName} Admin Panel`;
      } else {
        sidebarTitle.textContent = `${user.full_name}'s Panel`;
      }
    }
  } catch (error) {
    console.error(error);
  }
});
