const express = require('express');
const logger = require('morgan');
const cors = require('cors');

const { scrapeAmazonProductReviews, getReviewsFromS3 }  = require('./backendFunctions');


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

    if (!productUrl.includes('/dp/')) {
        return res.status(400).json({ error: 'URL provided doesn\'t redirect to an Amazon product' });
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


app.get('/get-reviews-from-s3', async (req, res) => {
    const key = req.query.key; 

    if (!key) {
        return res.status(400).json({ error: 'S3 key is required' });
    }

    try {
        const reviews = await getReviewsFromS3(key);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews from S3:', error);
        res.status(500).json({ error: 'Could not retrieve reviews' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});