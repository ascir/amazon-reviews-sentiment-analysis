async function getProductSentiment() {
    const productUrl = document.getElementById('productUrl').value;
    const response = await fetch(`/get-product-sentiment?productUrl=${encodeURIComponent(productUrl)}`);
    const data = await response.json();

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

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
                    <th>Most Common Positive Words</th>
                    <th>Most Common Negative Words</th>
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
}

function displayRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '⭐';
    }
    if (halfStar) {
        starsHtml += '⭐️';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '⭐️';
    }
    return starsHtml;
}
