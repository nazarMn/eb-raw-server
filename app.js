const express = require('express');
const dontenv = require('dotenv');
const app = express();
const PORT  = 5000;

dontenv.config();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});
