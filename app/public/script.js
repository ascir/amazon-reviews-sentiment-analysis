async function getProductSentiment() {
    const productUrl = document.getElementById('productUrl').value;
    const response = await fetch(`/get-product-sentiment?productUrl=${encodeURIComponent(productUrl)}`);
    const data = await response.json();

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    // Store S3 key in local storage 
    localStorage.setItem('s3Object', data.s3ObjectName);
    console.log("S3 key stored in local storage")


    if (data.error) {
        // Display error message
        resultDiv.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        return;
    }

    // Display product info
    const productInfoDiv = document.createElement('div');
    productInfoDiv.className = 'product-info';
    productInfoDiv.innerHTML = `
        <img src="${data.productImageUrl}" alt="${data.productTitle}" class="product-image">
        <div>
            <h3>${data.productTitle}</h3>
            <div>${displayRatingStars(data.productRating)}</div>
        </div>
    `;
    resultDiv.appendChild(productInfoDiv);


    if (data.message) {
        // Display message if there are no reviews
        const messageDiv = document.createElement('div');
        messageDiv.style.textAlign = 'center'; // Center the text
        messageDiv.style.marginTop = '20px'; // Add space above the message
        messageDiv.innerHTML = `<div>${data.message}</div>`;
        resultDiv.appendChild(messageDiv);
        return;
    }

    // Display sentiment score and emoji
    const sentimentScoreDiv = document.createElement('div');
    sentimentScoreDiv.className = 'sentiment-score';
    sentimentScoreDiv.innerHTML = `
        <span>Sentiment Score: ${data.averageScore.toFixed(2)}</span>
        <span class="sentiment-emoji">
            ${data.averageScore > 0 ? '😊' : (data.averageScore < 0 ? '😞' : '😐')}
            </span>`;
    resultDiv.appendChild(sentimentScoreDiv);

    // Display most common positive and negative words
    const tableDiv = document.createElement('div');
    tableDiv.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Common Positive Words</th>
                    <th>Common Negative Words</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${data.mostCommonPositiveWords.join(', ')}</td>
                    <td>${data.mostCommonNegativeWords.join(', ')}</td>
                </tr>
            </tbody>
        </table>
    `;
    resultDiv.appendChild(tableDiv);

    // Display product info
    const getReviewsButtonDiv = document.createElement('div');
    getReviewsButtonDiv.innerHTML = `<button class="btn btn-primary" onclick="getReviewsFromS3()">Show 10 Random Reviews</button>`;
    resultDiv.appendChild(getReviewsButtonDiv);
}

async function getReviewsFromS3() {
    const s3ObjectKey = localStorage.getItem('s3Object');
    if (!s3ObjectKey) {
        alert('Sorry, no reviews available at this time.');
        return;
    }

    try {
        // Fetch data from your server which will retrieve data from S3
        const response = await fetch(`/get-reviews-from-s3?key=${encodeURIComponent(s3ObjectKey)}`);
        const data = await response.json();

        // Get the result div and the reviews table
        const resultDiv = document.getElementById('result');
        let reviewsTable = document.getElementById('reviewsTable');

        // If the reviews table exists, clear its content; otherwise, create a new table
        if (reviewsTable) {
            reviewsTable.innerHTML = '';
        } else {
            reviewsTable = document.createElement('table');
            reviewsTable.id = 'reviewsTable';
            reviewsTable.className = 'table table-striped';
            resultDiv.appendChild(reviewsTable);
        }

        // Create a table body to display the random reviews
        const tableBody = document.createElement('tbody');
        data.forEach((review, index) => {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.innerText = `${index + 1}. ${review}`;
            row.appendChild(cell);
            tableBody.appendChild(row);
        });
        reviewsTable.appendChild(tableBody);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        alert('Failed to fetch reviews.');
    }
}


function displayRatingStars(rating) {
    const fullStars = Math.floor(rating);

    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '⭐';
    }
    
    return starsHtml;
}






