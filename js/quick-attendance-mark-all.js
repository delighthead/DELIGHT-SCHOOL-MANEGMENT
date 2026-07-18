document.addEventListener("DOMContentLoaded", function () {
  const markBox = document.getElementById("quickMarkAllButtons");
  const presentBtn = document.getElementById("markAllPresentBtn");
  const absentBtn = document.getElementById("markAllAbsentBtn");
  const quickBox = document.getElementById("quickAttendanceBox");
  const loadBtn = document.getElementById("loadQuickStudentsBtn");

  function showButtonsIfStudentsLoaded() {
    const statuses = document.querySelectorAll(".quick-status");

    if (markBox) {
      markBox.style.display = statuses.length > 0 ? "block" : "none";
    }
  }

  function markAll(status) {
    const statuses = document.querySelectorAll(".quick-status");

    if (statuses.length === 0) {
      alert("Please load students first.");
      return;
    }

    statuses.forEach(select => {
      select.value = status;
    });

    alert(`All loaded students marked as ${status === "present" ? "Present" : "Absent"}.`);
  }

  if (presentBtn) {
    presentBtn.addEventListener("click", function () {
      markAll("present");
    });
  }

  if (absentBtn) {
    absentBtn.addEventListener("click", function () {
      markAll("absent");
    });
  }

  if (loadBtn) {
    loadBtn.addEventListener("click", function () {
      setTimeout(showButtonsIfStudentsLoaded, 800);
      setTimeout(showButtonsIfStudentsLoaded, 1500);
    });
  }

  if (quickBox) {
    const observer = new MutationObserver(showButtonsIfStudentsLoaded);
    observer.observe(quickBox, { childList: true, subtree: true });
  }

  showButtonsIfStudentsLoaded();
});
