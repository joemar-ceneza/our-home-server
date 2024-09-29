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
    // Extract query parameters
    const { isNewProduct, isBSeller, slug } = req.query;

    // Build the filter object
    const filter = {};
    if (isNewProduct) {
      filter.isNewProduct = isNewProduct === "true"; // Convert to boolean
    }
    if (isBSeller) {
      filter.isBSeller = isBSeller === "true"; // Convert to boolean
    }

    // If a slug is provided, find the product by slug
    if (slug) {
      const product = await Product.findOne({ slug }).populate("category");
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      // Include category name in the returned product
      return res.json([
        {
          ...product.toObject(), // Convert to plain object
        },
      ]); // Return product in an array to match frontend expectation
    }

    // Fetch products based on filter and populate category
    const products = await Product.find(filter).populate("category");

    // Include category names in the response
    const productsWithCategory = products.map((product) => ({
      ...product.toObject(), // Convert to plain object
    }));
    res.json(productsWithCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// route to fetch related products by category
router.get("/products/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // fetch the product by slug
    const product = await Product.findOne({ slug }).populate("category");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // fetch related products based on the category
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id }, // execute the current product
    });

    // respond with product details and related products
    res.json({ product, relatedProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get featured products with pagination
router.get("/featured", async (req, res) => {
  const page = parseInt(req.query.page) || 1; // current page
  const pageSize = parseInt(req.query.pageSize) || 10; // default page size

  try {
    // find featured products
    const products = await Product.find({ isFeatured: true })
      .skip((page - 1) * pageSize) // skip previous pages results
      .limit(pageSize); // limit results to page size

    // get total count for pagination
    const totalProducts = await Product.countDocuments({ isFeatured: true });

    // calculate total number of pages
    const totalPages = Math.ceil(totalProducts / pageSize);

    res.status(200).json({
      products,
      pagination: { currentPage: page, totalPages, pageSize, totalProducts },
    });
  } catch (error) {
    console.error("Error fetching featured products: ", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// route to get products with search functionality
router.get("/search", async (req, res) => {
  const { name } = req.query;
  try {
    const products = await Product.find({
      name: new RegExp(name, "i"), // Case-insensitive search
    });
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
