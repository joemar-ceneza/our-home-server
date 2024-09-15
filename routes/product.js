const express = require("express");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/product");
const { uploadProductImage } = require("../middleware/multer");

const router = express.Router();

// create new product with image upload
router.post("/", uploadProductImage.single("image"), async (req, res) => {
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
      const publicId = req.file.filename.split(".")[0]; // extract the public id from the filename
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error)
          console.error("Error deleting image from Cloudinary:", error);
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

// route to get products based on query parameters
router.get("/products", async (req, res) => {
  try {
    // extract query parameters
    const { isNewProduct, isBSeller } = req.query;

    // build the filter object
    const filter = {};
    if (isNewProduct) {
      filter.isNewProduct = isNewProduct === "true"; // convert to boolean
    }
    if (isBSeller) {
      filter.isBSeller = isBSeller === "true"; // Convert to boolean
    }

    // fetch products based on filter
    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// update a product by id with image upload
router.put("/:id", uploadProductImage.single("image"), async (req, res) => {
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

    // find the product by id
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // update fields
    if (name) {
      product.name = name;
      product.slug = name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
    }
    if (description) product.description = description;
    if (regularPrice) product.regularPrice = regularPrice;
    if (salePrice) product.salePrice = salePrice;
    if (isOnSale) product.isOnSale = isOnSale;
    if (isBSeller) product.isBSeller = isBSeller;
    if (isNewProduct) product.isNewProduct = isNewProduct;
    if (isFeatured) product.isFeatured = isFeatured;
    if (category) product.category = category;

    if (imageUrl) {
      // extract public id from the old image url
      if (product.image) {
        const publicId = product.image
          .split("/")
          .slice(-4)
          .join("/")
          .split(".")[0];
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error("Error deleting old image from Cloudinary", error);
          return res
            .status(500)
            .json({ error: "Failed to delete old image from Cloudinary" });
        }
      }
      // set new image url
      product.image = imageUrl;
    }
    const updateProduct = await product.save();
    res.json(updateProduct);
  } catch (error) {
    // handle errors and clean up if needed
    if (req.file && req.file.path) {
      const publicId = req.file.filename.split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error(
          "Error deleting new image from Cloudinary after update failed:",
          error
        );
      }
    }
    res.status(400).json({ error: error.message });
  }
});

// delete a product by id with image upload
router.delete("/:id", async (req, res) => {
  try {
    // find the product by id
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // extract public id from the image url if the product has an image
    if (product.image) {
      const publicId = product.image
        .split("/")
        .slice(-4)
        .join("/")
        .split(".")[0];
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        return res
          .status(500)
          .json({ error: "Failed to delete image from Cloudinary" });
      }
    }

    // delete the product from the database
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product and associated image deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
