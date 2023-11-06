const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const responseTime = require('response-time')
const redis = require('redis');

const { scrapeAmazonProductReviews, getReviewsFromS3 } = require('./backendFunctions');

const app = express();
const port = 3000;

// Create and connect to the Redis client
const redisClient = redis.createClient({
    url: 'redis://redis:6379' // This uses the URL format to specify the Redis server location
  });
  
  // Connect to Redis
  (async () => {
    try {
      await redisClient.connect();
      console.log('Connected to Redis');
    } catch (err) {
      console.error('Redis connection error', err);
    }
  })();

  // Error event listener
redisClient.on('error', (err) => {
    console.error('Redis error', err);
  });

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

    // Use the product URL as the key for Redis
    const cacheKey = `sentiment:${productUrl}`;

    try {
        // Check if the data is in Redis
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            // If data is found in Redis cache, parse it and return
            return res.json(JSON.parse(cachedData));
        } else {
            // If not found, scrape the data
            const sentimentResults = await scrapeAmazonProductReviews(productUrl);
            console.log(sentimentResults);

            if (typeof sentimentResults === 'string') {
                // If the result is a string, it's an error message
                res.status(400).send(sentimentResults);
            } else {
                // Save the scraped data in Redis with an expiration time of 1 hour
                await redisClient.setEx(cacheKey, 3600, JSON.stringify(sentimentResults));
                res.send(sentimentResults);
            }
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