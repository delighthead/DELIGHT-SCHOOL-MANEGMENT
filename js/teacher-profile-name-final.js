document.addEventListener("DOMContentLoaded", function () {
  function getNameFromStorage() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return (
        user.full_name ||
        user.name ||
        user.teacher_name ||
        user.username ||
        ""
      );
    } catch (e) {
      return "";
    }
  }

  function putName(name) {
    if (!name) return;

    localStorage.setItem("teacher_profile_full_name", name);

    document.querySelectorAll("h3").forEach(function (h3) {
      if (h3.textContent.trim().toLowerCase() === "full name") {
        const parent = h3.parentElement;
        if (!parent) return;

        let p = parent.querySelector("p");
        if (!p) {
          p = document.createElement("p");
          parent.appendChild(p);
        }

        p.textContent = name;
      }
    });
  }

  function run() {
    const name =
      getNameFromStorage() ||
      localStorage.getItem("teacher_profile_full_name") ||
      "";

    putName(name);
  }

  run();
  setTimeout(run, 500);
  setTimeout(run, 1200);
  setInterval(run, 1500);
});
