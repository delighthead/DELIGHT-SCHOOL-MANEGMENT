document.addEventListener("DOMContentLoaded", function () {
  const page = (location.pathname.split("/").pop() || "").toLowerCase();

  const pagePrintConfig = {
    "parent-results.html": { id: "printParentScoresTab", label: "Print Scores / Results" },
    "parent-attendance.html": { id: "printParentAttendanceTab", label: "Print Attendance" },
    "parent-fees.html": { id: "printParentFeesTab", label: "Print Fees" },
    "parent-reports.html": { id: "printParentReportsTab", label: "Print Reports" },
    "scores.html": { id: "printScoresTab", label: "Print Scores" }
  };

  const config = pagePrintConfig[page];
  if (!config) return;

  const main = document.querySelector(".dashboard-main");
  if (!main) return;

  if (document.getElementById(config.id)) return;

  const holder = document.createElement("div");
  holder.style.margin = "10px 0 14px";
  holder.style.display = "flex";
  holder.style.justifyContent = "flex-end";

  const button = document.createElement("button");
  button.type = "button";
  button.id = config.id;
  button.className = "primary-btn";
  button.textContent = config.label;
  button.style.background = "#0f766e";
  button.style.color = "#ffffff";

  button.addEventListener("click", function () {
    window.print();
  });

  holder.appendChild(button);

  const firstSection = main.querySelector("section");
  if (firstSection) {
    main.insertBefore(holder, firstSection);
  } else {
    main.appendChild(holder);
  }
});
