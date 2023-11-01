const express = require('express');
const scrapeAmazonProductReviews = require('./scrape');

const app = express();
const port = 3000;

// Endpoint to handle Amazon URL requests
app.get('/get-product-sentiment', async (req, res) => {
    const productUrl = req.query.productUrl;
    console.log(productUrl);

    if (!productUrl) {
        return res.status(400).send({ error: 'URL is required' });
    }

    try {
        scrapeAmazonProductReviews(productUrl).then(sentimentResults => {
            console.log(sentimentResults);
            res.send(sentimentResults);
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
