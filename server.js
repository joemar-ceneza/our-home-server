// load environment variables from the .env file
require("dotenv").config();

// import dependencies
const express = require("express");
const cors = require("cors");
const connectToDb = require("./config/connectToDb");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// connect to database
connectToDb();

// use the category routes
app.use("/api/categories", categoryRoutes);
// use the product routes
app.use("/api/products", productRoutes);

// start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
