# ShelfWatch

Project by: Zuriel Pagan, Ram Senthil, Mark Joseph, Anh Nguyen
AWS Services Used: EC2, Lambda, DynamoDB, S3


# Overview

ShelfWatch is a cloud-powered pantry management system that helps users track food items, monitor expiration dates, and store images of each product. The project combines a simple, static web interface with a fully serverless backend, deployed and configured automatically using AWS CDK.
Once deployed, the terminal will produce an output called ShelfWatchStack.EC2PublicDNS. Copy this link and affix http:// to the front of it to access our application.


As currently implemented, the ShelfWatch website contains a home page and two other functional pages: Inventory and Upload.

o    The Upload page allows you to define a name, quantity, and expiration date for a food item to add to your pantry, as well as an image to go along with it.

o    This item will be added to our DynamoDB table, and the items currently in the pantry will be viewable on the Inventory page.


# Project Architecture

ShelfWatch follows a cloud-first design using several AWS services to build a lightweight yet scalable application.
Frontend (EC2 Instance)

o    Hosts the static HTML, CSS, JavaScript files.

o    Communicates with the backend through an API Gateway endpoint.

o    Uses a config.js file to dynamically store the current API URL and S3 bucket name created by the CDK deployment.

# Backend (Serverless)

o   AWS Lambda functions handle creating items, processing uploads, calculating days-left values, and retrieving inventory data.

o    Amazon DynamoDB stores item metadata, including:

o    item name

o    quantity

o    expiration date

o    S3 image link

o    Amazon S3 stores uploaded item images.

o    API Gateway forwards frontend requests to Lambda and enforces IAM-based access rules for security.

# Deployment (AWS CDK)

The entire infrastructure is managed through the CDK:

o    Provisions the EC2 instance, DynamoDB table, S3 bucket, Lambda functions, and API Gateway.

o    Automatically generates and outputs resource information (public DNS, bucket name, API URL).

o    Allows the entire project environment to be created, updated, or deleted with a single command.

# Key Features

o    Automated Cloud Deployment: One CDK deploy command launches the entire application.

o    Image Uploading: Users can upload photos for each pantry item; images are stored in S3.

o    Expiration Tracking: The system calculates and displays days remaining for each item.

o    Inventory Display: Items appear as structured, visual cards with their image, quantity, and expiration status.

o    Scalable Architecture: DynamoDB and Lambda ensure performance without needing manual server management.

o    Security: Security group and VPC is implemented for use with our EC2 instance.

project-root/
│
├── lib/ 
│   └── contains our CDK stack
│
├── html/
│   ├── contains our HTML page files
│   ├── css / js assets
│   └── config.js  (supplies the most recent API url and Bucket name to files that need them)
│
└── lambda/
    └── backend Lambda function code





