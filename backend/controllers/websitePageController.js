const db = require("../config/database");

exports.getAllPages = async (req, res) => {
  try {
    const [pages] = await db.query("SELECT * FROM website_pages ORDER BY id ASC");
    res.json({ message: "Website pages loaded successfully", pages });
  } catch (error) {
    res.status(500).json({ message: "Failed to load website pages", error: error.message });
  }
};

exports.getPageByKey = async (req, res) => {
  try {
    const { pageKey } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM website_pages WHERE page_key = ? LIMIT 1",
      [pageKey]
    );

    const [blocks] = await db.query(
      "SELECT * FROM website_content_blocks WHERE page_key = ? ORDER BY id ASC",
      [pageKey]
    );

    res.json({
      message: "Website page loaded successfully",
      page: rows[0] || null,
      blocks
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load website page", error: error.message });
  }
};

exports.getPageBlocks = async (req, res) => {
  try {
    const { pageKey } = req.params;

    const [blocks] = await db.query(
      "SELECT * FROM website_content_blocks WHERE page_key = ? ORDER BY id ASC",
      [pageKey]
    );

    res.json({ message: "Page blocks loaded successfully", blocks });
  } catch (error) {
    res.status(500).json({ message: "Failed to load page blocks", error: error.message });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const { pageKey } = req.params;

    const {
      page_title,
      section_title,
      section_content,
      button_text,
      button_link
    } = req.body;

    await db.query(
      `UPDATE website_pages
       SET page_title = ?,
           section_title = ?,
           section_content = ?,
           button_text = ?,
           button_link = ?
       WHERE page_key = ?`,
      [
        page_title || "",
        section_title || "",
        section_content || "",
        button_text || "",
        button_link || "",
        pageKey
      ]
    );

    res.json({ message: "Website page updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update website page", error: error.message });
  }
};

exports.updatePageBlocks = async (req, res) => {
  try {
    const { pageKey } = req.params;
    const { blocks } = req.body;

    if (!Array.isArray(blocks)) {
      return res.status(400).json({ message: "Blocks must be an array" });
    }

    for (const block of blocks) {
      await db.query(
        `UPDATE website_content_blocks
         SET block_content = ?
         WHERE page_key = ? AND block_key = ?`,
        [block.block_content || "", pageKey, block.block_key]
      );
    }

    res.json({ message: "All page writings updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update page writings", error: error.message });
  }
};
