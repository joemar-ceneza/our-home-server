const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// configuration for category images
const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "e-commerce/our-home/categories", // specify the folder in cloudinary
    allowedFormats: ["jpg", "png", "jpeg"],
  },
});

// middleware for category image uploads
const uploadCategoryImage = multer({ storage: categoryStorage });

// configuration for product images
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "e-commerce/our-home/products",
    allowedFormats: ["jpg", "png", "jpeg"],
  },
});

// middleware for category image uploads
const uploadProductImage = multer({ storage: productStorage });

module.exports = { uploadCategoryImage, uploadProductImage };
