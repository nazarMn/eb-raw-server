const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const cloudinary = require('./cloudinary');
const mongoose = require('mongoose');
const fs = require('fs');
const Product = require('./models/Product');
const Review = require('./models/Review');
const Order = require('./models/Order');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require("body-parser");

dotenv.config();

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());
const PORT = 5000;


app.use(cors());

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
 *               previousPrice:
 *                 type: number
 *                 description: "Це стара ціна продукту (може бути null для нових продуктів)"
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

    const previousPrice = req.body.previousPrice === "" ? null : req.body.previousPrice;

    const newProduct = new Product({
      name: req.body.name,
      type: req.body.type,
      price: req.body.price,
      previousPrice: previousPrice,
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

app.get('/api/products', async (req, res) => {
  try {
    const { name } = req.query;  
    let products;
    
    if (name) {
      products = await Product.find({ name: { $regex: name, $options: 'i' } });
    } else {
      products = await Product.find();
    }
    
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




/**
 * @swagger
 * /api/reviews:
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
 *               comment:
 *                 type: string
 *               name:
 *                 type: string  
 *               rating:
 *                 type: number
 *     responses:
 *       201:
 *         description: Успішно створено продукт
 *       500:
 *         description: Помилка сервера
 */




app.post('/api/reviews', upload.single('image'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'reviews',
    });

    const newReview = new Review({
      name: req.body.name,
      rating: req.body.rating,
      comment: req.body.comment,
      imageUrl: result.secure_url,
    });

    await newReview.save();
    fs.unlinkSync(req.file.path);
    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find();
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(token, { polling: true });

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const order = new Order(orderData);
    const savedOrder = await order.save();

  
    let message = `🛒 *New order!*\n\n`;
    message += `👤 Name: *${orderData.name} ${orderData.surname}*\n`;
    message += `📧 Email: ${orderData.email}\n`;
    message += `📱 Phone: ${orderData.phoneNumber}\n`;
    message += `🏙️ City: ${orderData.city}\n`;
    message += `🏤 Post office: ${orderData.postOfficeBranch}\n\n`;

    message += `🧾 *Goods:*\n`;
    orderData.orderItems.forEach((item, index) => {
      message += `  ${index + 1}. ${item.productName} x${item.quantity}\n`;
    });

    message += `\n💳 Payment: ${orderData.paymentMethod === 'card' ? 'By card' : 'Сash on delivery'}\n`;
    message += `💰 Total amount: *${orderData.totalPrice} $*\n`;
    message += `🕐 Date of order: ${new Date(savedOrder.createdAt).toLocaleString('uk-UA')}`;

  
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    res.status(201).json({ message: 'Order saved and sent to Telegram', order: savedOrder });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ message: 'Error saving order', error: error.message });
  }
});



bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 Відкрий WebApp", {
    reply_markup: {
      keyboard: [
        [
          {
            text: "🛍 Відкрити магазин",
            web_app: { url: "https://eb-raw.vercel.app/" },
          },
        ],
      ],
      resize_keyboard: true,
    },
  });
});

bot.on("message", (msg) => {
  if (msg.web_app_data) {
    const data = JSON.parse(msg.web_app_data.data);
    console.log("📩 Отримано з WebApp:", data);
    bot.sendMessage(msg.chat.id, `✅ Ти замовив: ${data.item}`);
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
