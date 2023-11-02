const puppeteer = require('puppeteer');
const Sentiment = require('sentiment');
const AWS = require('aws-sdk');
const crypto = require('crypto');

require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "ap-southeast-2",
});

const s3 = new AWS.S3();

const sentiment = new Sentiment();

async function scrapeAmazonProductReviews(productUrl) {
    // Check if URL is provided
    if (!productUrl) {
        return "URL not provided!";
    }

    // Check if the URL is valid
    try {
        new URL(productUrl);
    } catch (error) {
        return "Invalid URL!";
    }

    // Check if the URL contains amazon.com
    if (!productUrl.includes('amazon.com')) {
        return "Sorry, we only accept links to products on Amazon";
    }


    // Trim the URL to get the base URL of the product
    productUrlParsed = `"${productUrl}"`

    const shortUrl = productUrl.split('/ref')[0] + '/';

    const reviewUrl = shortUrl.replace('/dp/', '/product-reviews/') + 'ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews';

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Go to the product page to extract product details
    await page.goto(shortUrl);

    // Extract product title, image URL, and rating
    const productDetails = await page.evaluate(() => {
        const title = document.querySelector('#productTitle') ? document.querySelector('#productTitle').innerText.trim() : null;
        const imageUrl = document.querySelector('#imgTagWrapperId img') ? document.querySelector('#imgTagWrapperId img').src : null;
        const ratingElement = document.querySelector('.a-declarative .a-popover-trigger .a-size-base.a-color-base');
        const rating = ratingElement ? ratingElement.innerText.trim() : null;
        return { title, imageUrl, rating };
    });


    // Go to the reviews page
    await page.goto(reviewUrl, { waitUntil: 'networkidle0' });

    let allReviews = [];

    while (true) {
        // Extract reviews from the current page
        const reviews = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.review-text-content')).map(review => review.innerText.trim());
        });

        allReviews = allReviews.concat(reviews);

        // Try to find the 'Next Page' URL
        const nextPageUrl = await page.evaluate(() => {
            const nextPageLink = document.querySelector('li.a-last a');
            return nextPageLink ? nextPageLink.href : null;
        });

        if (nextPageUrl) {
            await page.goto(nextPageUrl, { waitUntil: 'networkidle0' });
        } else {
            // No more pages
            break;
        }
    }

    await browser.close();

    // Check if there are no reviews
    if (allReviews.length === 0) {
        return {
            productUrl: productUrl,
            productTitle: productDetails.title,
            productImageUrl: productDetails.imageUrl,
            productRating: productDetails.rating,
            message: "This product has no reviews yet!"
        };
    }

    // Perform sentiment analysis on each review
    const sentimentResults = allReviews.map(review => {
        return {
            review,
            sentiment: sentiment.analyze(review)
        };
    });

    // Initialize variables for averages and word frequencies
    let totalScore = 0;
    let totalComparative = 0;
    const positiveWordFrequency = {};
    const negativeWordFrequency = {};

    // Loop through sentiment results to calculate averages and word frequencies
    sentimentResults.forEach(result => {
        totalScore += result.sentiment.score;
        totalComparative += result.sentiment.comparative;

        result.sentiment.positive.forEach(word => {
            positiveWordFrequency[word] = (positiveWordFrequency[word] || 0) + 1;
        });

        result.sentiment.negative.forEach(word => {
            negativeWordFrequency[word] = (negativeWordFrequency[word] || 0) + 1;
        });
    });

    // Calculate averages
    const averageScore = totalScore / sentimentResults.length;
    const averageComparative = totalComparative / sentimentResults.length;

    // Sort and get top 5 positive and negative words
    const sortedPositiveWords = Object.entries(positiveWordFrequency).sort((a, b) => b[1] - a[1]).slice(0, 5).map(item => item[0]);
    const sortedNegativeWords = Object.entries(negativeWordFrequency).sort((a, b) => b[1] - a[1]).slice(0, 5).map(item => item[0]);
    const hash = crypto.createHash('sha256').update(productDetails.title).digest('hex');
    const fileName = `${hash}.json`;

      
    if (allReviews.length > 0) {
        const dataToSave = {
            productUrl: productUrl,
            productTitle: productDetails.title,
            productImageUrl: productDetails.imageUrl,
            productRating: productDetails.rating,
            averageScore,
            averageComparative,
            mostCommonPositiveWords: sortedPositiveWords,
            mostCommonNegativeWords: sortedNegativeWords,
            numberOfReviewsAnalysed: allReviews.length,
            productReviews: allReviews
        };

        // Upload to S3
        const params = {
            Bucket: 'amazonproductreviews',
            Key: fileName,
            Body: JSON.stringify(dataToSave),
            ContentType: 'application/json'
        };

        s3.upload(params, function (err, data) {
            if (err) {
                console.error("Error uploading to S3:", err);
            } else {
                console.log("Successfully uploaded data to S3:", data.Location);
            }
        });
    }
    // Return the overall object
    return {
        productUrl: productUrl,
        productTitle: productDetails.title,
        productImageUrl: productDetails.imageUrl,
        productRating: productDetails.rating,
        averageScore,
        averageComparative,
        mostCommonPositiveWords: sortedPositiveWords,
        mostCommonNegativeWords: sortedNegativeWords,
        numberOfReviewsAnalysed: allReviews.length,
        s3ObjectName: fileName
    };
}

async function getReviewsFromS3(key) {
    const params = {
        Bucket: 'amazonproductreviews', // Replace with your S3 bucket name
        Key: key
    };

    try {
        const data = await s3.getObject(params).promise();
        const jsonData = JSON.parse(data.Body.toString());
        const reviews = jsonData.productReviews;

        // Shuffle the reviews array
        for (let i = reviews.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [reviews[i], reviews[j]] = [reviews[j], reviews[i]];
        }

        // Return 10 random reviews
        return reviews.slice(0, 10);
    } catch (error) {
        console.log('Error fetching reviews from S3:', error);
        throw error;
    }
}


// Test function
// const productUrl = 'https://www.amazon.com.au/Apple-iPhone-SIM-Free-Smartphone-Renewed/dp/B07T3BM4H1/ref=cm_cr_arp_d_product_top?ie=UTF8';
// scrapeAmazonProductReviews(productUrl).then(sentimentResults => {
//     console.log(sentimentResults);
// });
// scrapeAmazonProductReviews(productUrl);
// async function testGetReviewsFromS3() {
//     try {
//         const key = 'fc6bfe6d289ec15613ea71706b78772cb4cd1a4c6bb4b24ef49b70915f343354.json'; // Replace with a valid key
//         const reviews = await getReviewsFromS3(key);
//         console.log('Reviews:', reviews);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }

// // Run the test function
// testGetReviewsFromS3();

module.exports = {
    scrapeAmazonProductReviews,
    getReviewsFromS3
};