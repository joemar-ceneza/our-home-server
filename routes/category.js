const express = require("express");
const cloudinary = require("cloudinary").v2;
const Category = require("../models/category");
const upload = require("../middleware/multer");

const router = express.Router();

// create new category with image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;
    const imageUrl = req.file ? req.file.path : undefined;

    const newCategory = new Category({
      name,
      image: imageUrl,
    });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    // delete the uploaded image from cloudinary if an error occurs
    if (req.file && req.file.path) {
      const publicId = req.file.filename.split(".")[0]; // Extract the public ID from the filename
      cloudinary.uploader.destroy(publicId, (err, result) => {
        if (err) console.error("Error deleting image from Cloudinary:", err);
      });
    }
    res.status(400).json({ error: error.message });
  }
});

// get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get a single category by ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// update a category by ID with image upload
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;
    const imageUrl = req.file ? req.file.path : undefined;

    // Find the category by ID
    let category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // Update fields
    if (name) {
      category.name = name;
      category.slug = name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
    }
    if (description) category.description = description;

    if (imageUrl) {
      // Extract public ID from the old image URL
      if (category.image) {
        const publicId = category.image
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Error deleting old image from Cloudinary:", err);
          return res
            .status(500)
            .json({ error: "Failed to delete old image from Cloudinary" });
        }
      }
      // Set new image URL
      category.image = imageUrl;
    }

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    // Handle errors and clean up if needed
    if (req.file && req.file.path) {
      const publicId = req.file.filename.split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error(
          "Error deleting new image from Cloudinary after update failed:",
          err
        );
      }
    }
    res.status(400).json({ error: error.message });
  }
});

// delete a category by ID
router.delete("/:id", async (req, res) => {
  try {
    // Find the category by ID
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // Extract public ID from the image URL if the category has an image
    if (category.image) {
      const publicId = category.image
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("Error deleting image from Cloudinary:", err);
        return res
          .status(500)
          .json({ error: "Failed to delete image from Cloudinary" });
      }
    }

    // Delete the category from the database
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category and associated image deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
