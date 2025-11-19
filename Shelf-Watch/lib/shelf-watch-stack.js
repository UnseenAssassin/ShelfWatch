const { Stack, Duration } = require('aws-cdk-lib/core');
// const sqs = require('aws-cdk-lib/aws-sqs');

const { Stack, RemovalPolicy } = require('aws-cdk-lib');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const S3 = require('aws-cdk-lib/aws-s3');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');
const lambda = require('aws-cdk-lib/aws-lambda');
const sns = require('aws-cdk-lib/aws-sns');
const cognito = require('aws-cdk-lib/aws-cognito');


class ShelfWatchStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) 
  {
    super(scope, id, props);
//===============================================================================
// DynamoDB Table
//============================================================================
const table = new dynamodb.Table(this, 'PantryItems', {
      partitionKey: { name: 'itemId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      gsiIndexes: [
        {
          indexName: 'LocationIndex',
          partitionKey: { name: 'location', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'expirationDate', type: dynamodb.AttributeType.STRING }
        }
      ]
    });
    //===============================================================================
    // S3 Bucket (Food Images)
    //============================================================================
  const bucket = new s3.Bucket(this, 'FoodImages', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }
}

module.exports = { ShelfWatchStack }
