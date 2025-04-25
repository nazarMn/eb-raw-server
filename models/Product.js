// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  previousPrice: { type: Number }, // Store the previous price here
  imageUrl: { type: String, required: true },
  description: { type: String },
  rating: { type: Number, default: 0 },         
  ratingCount: { type: Number, default: 0 },      
});

module.exports = mongoose.model("Product", productSchema);
