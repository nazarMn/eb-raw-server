const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const cloudinary = require('./cloudinary');
const mongoose = require('mongoose');
const fs = require('fs');
const Product = require('./models/Product');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

dotenv.config();

const app = express();
const PORT = 5000;


const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Product API',
      version: '1.0.0',
      description: 'API for managing products',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./app.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

app.use(express.json());

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Створити новий продукт
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               rating:
 *                 type: number
 *               ratingCount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Успішно створено продукт
 *       500:
 *         description: Помилка сервера
 */



app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'products',
    });

    const newProduct = new Product({
      name: req.body.name,
      type: req.body.type,
      price: req.body.price,
      imageUrl: result.secure_url,
      description: req.body.description,
      rating: req.body.rating,
      ratingCount: req.body.ratingCount,
    });

    await newProduct.save();
    fs.unlinkSync(req.file.path);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
