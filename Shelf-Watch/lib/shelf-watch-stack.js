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
    const table = new dynamodb.Table(this, 'ShelfWatchTable',
      {
      partitionKey: {name: 'id', type: dynamodb.AttributeType.STRING},
      removalPolicy: removalPolicy.DESTROY
      
    })
   
  }
}

module.exports = { ShelfWatchStack }
