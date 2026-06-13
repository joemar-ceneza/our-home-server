// load environment variables from the .env file
require("dotenv").config();

// import dependencies
const express = require("express");
const cors = require("cors");
const connectToDb = require("./config/connectToDb");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const paymentRoutes = require("./routes//payment");

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
// CLIENT_URL may hold a comma-separated allowlist. If it's unset we allow all
// origins (the catalog reads are public anyway) so a missing env var can never
// silently break product loading. localhost is always allowed for development.
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalhost = origin && /^http:\/\/localhost(:\d+)?$/.test(origin);
      if (
        allowedOrigins.length === 0 ||
        !origin ||
        allowedOrigins.includes(origin) ||
        isLocalhost
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

// connect to database
connectToDb();

// use the category routes
app.use("/api/categories", categoryRoutes);
// use the product routes
app.use("/api/products", productRoutes);
// use the payments routes
app.use("/api/orders", paymentRoutes);

// start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
