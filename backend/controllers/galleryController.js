const db = require("../config/database");

exports.getGalleryImages = async (req, res) => {
  try {
    const [images] = await db.query(
      `SELECT *
       FROM website_gallery
       WHERE status = 'active'
       ORDER BY id DESC`
    );

    res.json({
      message: "Gallery images loaded successfully",
      images
    });
  } catch (error) {
    console.error("Load gallery error:", error);
    res.status(500).json({
      message: "Failed to load gallery images",
      error: error.message
    });
  }
};

exports.uploadGalleryImage = async (req, res) => {
  try {
    const { image_title, image_caption, category } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image to upload."
      });
    }

    const imagePath = "/uploads/gallery/" + req.file.filename;

    await db.query(
      `INSERT INTO website_gallery
       (category, image_title, image_caption, image_path, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [
        category || "",
        image_title || "",
        image_caption || "",
        imagePath
      ]
    );

    res.json({
      message: "Gallery image uploaded successfully",
      image_path: imagePath
    });
  } catch (error) {
    console.error("Upload gallery error:", error);
    res.status(500).json({
      message: "Failed to upload gallery image",
      error: error.message
    });
  }
};

exports.deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE website_gallery
       SET status = 'deleted'
       WHERE id = ?`,
      [id]
    );

    res.json({
      message: "Gallery image deleted successfully"
    });
  } catch (error) {
    console.error("Delete gallery error:", error);
    res.status(500).json({
      message: "Failed to delete gallery image",
      error: error.message
    });
  }
};
