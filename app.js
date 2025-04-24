const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const cloudinary = require('./cloudinary');
const mongoose = require('mongoose');
const fs = require('fs');

const app = express();
const PORT  = 5000;

dotenv.config();


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));


app.use(express.json());


app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});
