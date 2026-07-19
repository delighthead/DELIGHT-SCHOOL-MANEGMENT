document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  function fullUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return API + path;
  }

  async function loadGalleryImages() {
    try {
      const res = await fetch(`${API}/api/gallery`);
      const data = await res.json();

      if (!res.ok) return;

      const images = data.images || [];

      images.forEach(image => {
        const category = image.category;
        const card = document.querySelector(`[data-gallery-card="${category}"]`);

        if (!card) return;

        const imageBox = card.querySelector(".gallery-image-box");
        const titleBox = card.querySelector(".gallery-title");
        const captionBox = card.querySelector(".gallery-caption");

        if (imageBox && image.image_path) {
          imageBox.innerHTML = `
            <img src="${fullUrl(image.image_path)}" alt="${image.image_title || "Gallery Image"}">
          `;
        }

        if (titleBox && image.image_title) {
          titleBox.textContent = image.image_title;
        }

        if (captionBox && image.image_caption) {
          captionBox.textContent = image.image_caption;
        }
      });
    } catch (error) {
      console.error("Gallery load error:", error);
    }
  }

  loadGalleryImages();
});
