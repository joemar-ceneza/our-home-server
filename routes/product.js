const express = require("express");
const Product = require("../models/product");
const upload = require("../middleware/multer");

const router = express.Router();

// create new product with image upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      description,
      regularPrice,
      salePrice,
      isOnSale,
      isBSeller,
      isNewProduct,
      isFeatured,
      category,
    } = req.body;
    const imageUrl = req.file ? req.file.path : undefined;

    const newProduct = new Product({
      name,
      description,
      image: imageUrl,
      regularPrice,
      salePrice,
      isOnSale,
      isBSeller,
      isNewProduct,
      isFeatured,
      category,
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
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

// get all product
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// update a product by ID
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// delete a product by ID
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(400).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
