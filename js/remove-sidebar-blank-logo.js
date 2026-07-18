document.addEventListener("DOMContentLoaded", function () {
  function cleanBlankSidebarImages() {
    const sidebar = document.querySelector(".sidebar, aside");
    if (!sidebar) return;

    sidebar.querySelectorAll("img").forEach(img => {
      const src = img.getAttribute("src") || "";

      // Do not remove the large admin/user profile picture
      const isLargeProfile =
        img.className.toLowerCase().includes("profile") ||
        img.closest(".profile-picture") ||
        img.closest(".admin-profile-picture");

      if (isLargeProfile) return;

      // Hide broken/empty small logo boxes
      if (!src || img.naturalWidth === 0 || img.naturalHeight === 0) {
        img.style.display = "none";
      }
    });

    // Hide empty white rounded boxes if any remain
    sidebar.querySelectorAll("div, span").forEach(el => {
      const text = el.textContent.trim();
      const hasImg = el.querySelector("img");

      if (!text && !hasImg && el.offsetWidth > 40 && el.offsetHeight > 10) {
        el.style.display = "none";
      }
    });
  }

  cleanBlankSidebarImages();
  setTimeout(cleanBlankSidebarImages, 500);
  setTimeout(cleanBlankSidebarImages, 1500);
});
