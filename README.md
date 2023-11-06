# AmazInsights: The Amazon Review Sentiment Analyzer

AmazInsights is a powerful tool designed to scrape and analyze customer reviews from Amazon product pages. It provides sentiment analysis to help businesses and individuals gauge the overall sentiment of the reviews, offering valuable insights into customer satisfaction and product reception.

## Description

AmazInsights leverages web scraping techniques (node Puppeteer package) to extract reviews from Amazon product pages and uses sentiment analysis algorithms to determine the sentiment score of each review. The application runs on a Node.js server and uses Redis for caching, ensuring efficient and fast retrieval of previously analyzed data.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Docker and Docker Compose are installed on your machine.
- Node.js and npm are installed if you plan to run the app without Docker.
- An Amazon AWS account is set up if you wi```sh to deploy the app on AWS services.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Running with Docker

1. Clone the repository:
   ```sh
   git clone https://github.com/ascir/amazon-reviews-sentiment-analysis.git
   ```
2. Navigate to the project directory:
   ```sh
   
   cd amazinsights/app
   ```
3. Build and run the application using Docker Compose:
   ```sh
   
   docker-compose up --build
   ```
4. The application should now be running on http://localhost:8000.

### Running Locally Without Docker
1. Clone the repository:
   
   ```sh
   git clone https://github.com/your-username/amazinsights.git
   ```

2. Navigate to the project directory:

   ```sh
   cd amazinsights/app
   ```

3. Install the dependencies:

```sh
npm install
```

4. Start the Redis server on your local machine. (More instructions on  [Redis docs](https://redis.io/docs/about/)

5. Run the application:

   ```sh
   npm start
   ```

The application should now be running on http://localhost:3000.

### Architecture
![architecture](https://github.com/ascir/amazon-reviews-sentiment-analysis/blob/main/app/public/images/ClusterArchitecture.png)


### Usage
To analyze the sentiment of Amazon product reviews, send a GET request to the /get-product-sentiment endpoint with the product URL as a query parameter:

*http*

**GET** http://localhost:8000/get-product-sentiment?productUrl=<AMAZON_PRODUCT_PAGE_URL>
The response will include the sentiment analysis of the reviews.

### Deployment
For deployment on AWS or any other cloud service, please ensure you configure the environment variables accordingly and set up the services such as Amazon RDS for Redis, EC2 instances, and load balancers as required.


### License
This project is licensed under the MIT License - see the LICENSE.md file for details.

### Acknowledgments
Node.js community for the vast npm ecosystem.
Amazon AWS for cloud services.
The creators of the various npm packages used in this project.
