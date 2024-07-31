const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// connect to mongodb
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Could not connect to MongoDB", error);
  }
};

// call the function to connect to the database
connectDB();

// define routes
app.get("/", (req, res) => {
  res.send("Hello from the MERN stack server!");
});

// start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
