const express = require("express");
const cloudinary = require("cloudinary").v2;
const Category = require("../models/category");
const { uploadCategoryImage } = require("../middleware/multer");

const router = express.Router();

// create new category with image upload
router.post("/", uploadCategoryImage.single("image"), async (req, res) => {
  try {
    const { name, products } = req.body;
    const imageUrl = req.file ? req.file.path : undefined;

    const newCategory = new Category({
      name,
      image: imageUrl,
      products,
    });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    // delete the uploaded image from cloudinary if an error occurs
    if (req.file && req.file.path) {
      const publicId = req.file.filename.split(".")[0]; // extract the public id from the filename
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

// get a single category by id
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// route to get products by category slug
router.get("/categories/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const category = await Category.findOne({ slug }).populate("products");

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // include the category slug in the response
    res.json({
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
      },
      products: category.products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// update a category by id with image upload
router.put("/:id", uploadCategoryImage.single("image"), async (req, res) => {
  try {
    const { name, products } = req.body;
    const imageUrl = req.file ? req.file.path : undefined;

    // find the category by id
    let category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // update fields
    if (name) {
      category.name = name;
      category.slug = name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
    }
    if (products) category.products = products;

    if (imageUrl) {
      // extract public id from the old image url
      if (category.image) {
        const publicId = category.image
          .split("/")
          .slice(-4)
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
    // handle errors and clean up if needed
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

// delete a category by id
router.delete("/:id", async (req, res) => {
  try {
    // find the category by id
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // extract public id from the image url if the category has an image
    if (category.image) {
      const publicId = category.image
        .split("/")
        .slice(-4)
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

    // delete the category from the database
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category and associated image deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
