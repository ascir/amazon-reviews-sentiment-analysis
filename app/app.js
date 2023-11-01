const express = require('express');
const logger = require('morgan');
const cors = require('cors');

const scrapeAmazonProductReviews = require('./scrape');


const app = express();
const port = 3000;

app.use(logger('tiny'));
require('dotenv').config();

app.use(cors()); // Prevents CORS error

// Render static page
app.use(express.static('public'));

// Endpoint to handle Amazon URL requests
app.get('/get-product-sentiment', async (req, res) => {
    const productUrl = req.query.productUrl;

    if (!productUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    if (!productUrl.includes('amazon.com')) {
        return res.status(400).json({ error: 'Sorry we only accept links to products on Amazon' });
    }
    
    try {
        const sentimentResults = await scrapeAmazonProductReviews(productUrl);
        console.log(sentimentResults);

        if (typeof sentimentResults === 'string') {
            // If the result is a string, it's an error message
            res.status(400).send(sentimentResults);
        } else {
            res.send(sentimentResults);
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});