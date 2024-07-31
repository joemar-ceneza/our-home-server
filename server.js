// import dependencies
const express = require("express");
const cors = require("cors");
const connectToDb = require("./config/connectToDb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// connect to database
connectToDb();

// define routes
app.get("/", (req, res) => {
  res.send("Hello from the MERN stack server!");
});

// start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
