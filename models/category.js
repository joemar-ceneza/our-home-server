const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 50,
    },
    slug: {
      type: String,
      unique: true,
    },
    image: {
      type: String, // url to the product image
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // reference to the product model
      },
    ],
  },
  {
    timestamps: true, // automatically and createAt and updateAt fields
  }
);

// pre-save hook to automatically generate a slug from the name
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
  }
  next();
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
