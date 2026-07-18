document.addEventListener("DOMContentLoaded", function () {
  const API = "http://127.0.0.1:5000";

  function token() {
    return localStorage.getItem("token") || "";
  }

  function fullUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return API + path;
  }

  function isGallerySelected() {
    const pageKey = document.getElementById("page_key");
    return pageKey && pageKey.value === "gallery";
  }

  function categoryLabel(value) {
    const labels = {
      school_building: "School Building",
      cultural_day: "Cultural Day",
      sports_day: "Sports Day",
      graduation: "Graduation",
      excursion: "Excursion",
      clubs: "Clubs"
    };

    return labels[value] || value || "";
  }

  function toggleGallerySection() {
    const section = document.getElementById("galleryAdminSection");
    if (!section) return;

    section.style.display = isGallerySelected() ? "block" : "none";

    if (isGallerySelected()) {
      loadGalleryImages();
    }
  }

  async function loadGalleryImages() {
    const box = document.getElementById("adminGalleryList");
    if (!box) return;

    box.innerHTML = "<p>Loading gallery pictures...</p>";

    try {
      const res = await fetch(`${API}/api/gallery`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load gallery pictures.");
      }

      const images = data.images || [];

      if (images.length === 0) {
        box.innerHTML = "<p>No gallery pictures uploaded yet.</p>";
        return;
      }

      box.innerHTML = "";

      images.forEach(image => {
        const card = document.createElement("div");
        card.className = "gallery-admin-card";

        card.innerHTML = `
          <img src="${fullUrl(image.image_path)}" alt="${image.image_title || "Gallery Image"}">
          <h3>${image.image_title || categoryLabel(image.category)}</h3>
          <p><b>Category:</b> ${categoryLabel(image.category)}</p>
          <p>${image.image_caption || ""}</p>
          <button type="button" class="small-btn danger delete-gallery-btn" data-id="${image.id}">
            Delete
          </button>
        `;

        box.appendChild(card);
      });
    } catch (error) {
      box.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
  }

  async function uploadGalleryImage(event) {
    event.preventDefault();

    const category = document.getElementById("gallery_category").value;
    const title = document.getElementById("gallery_image_title").value.trim();
    const caption = document.getElementById("gallery_image_caption").value.trim();
    const fileInput = document.getElementById("gallery_image_file");

    if (!category) {
      alert("Please select gallery category.");
      return;
    }

    if (!fileInput.files || fileInput.files.length === 0) {
      alert("Please select a picture.");
      return;
    }

    const formData = new FormData();
    formData.append("category", category);
    formData.append("image_title", title || categoryLabel(category));
    formData.append("image_caption", caption);
    formData.append("gallery_image", fileInput.files[0]);

    try {
      const res = await fetch(`${API}/api/gallery`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`
        },
        body: formData
      });

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Backend did not return JSON: " + text.substring(0, 120));
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to upload picture.");
      }

      alert("Gallery picture uploaded successfully.");
      document.getElementById("galleryUploadForm").reset();
      loadGalleryImages();
    } catch (error) {
      alert(error.message);
    }
  }

  async function deleteGalleryImage(id) {
    if (!confirm("Delete this gallery picture?")) return;

    try {
      const res = await fetch(`${API}/api/gallery/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token()}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete picture.");
      }

      alert("Gallery picture deleted.");
      loadGalleryImages();
    } catch (error) {
      alert(error.message);
    }
  }

  document.addEventListener("change", function (event) {
    if (event.target && event.target.id === "page_key") {
      toggleGallerySection();
    }
  });

  document.addEventListener("submit", function (event) {
    if (event.target && event.target.id === "galleryUploadForm") {
      uploadGalleryImage(event);
    }
  });

  document.addEventListener("click", function (event) {
    const btn = event.target.closest(".delete-gallery-btn");
    if (!btn) return;

    deleteGalleryImage(btn.dataset.id);
  });

  setTimeout(toggleGallerySection, 500);
  setTimeout(toggleGallerySection, 1500);
});
