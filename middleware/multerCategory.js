const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "e-commerce/our-home/categories", // specify the folder in cloudinary
    allowedFormats: ["jpg", "png", "jpeg"],
  },
});

const uploadCategoryImage = multer({ storage: categoryStorage });

module.exports = uploadCategoryImage;
