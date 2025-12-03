///const { Stack, Duration } = require('aws-cdk-lib/core');
// const sqs = require('aws-cdk-lib/aws-sqs');

///const { Stack, RemovalPolicy } = require('aws-cdk-lib');
////const { Stack, Duration, RemovalPolicy } = require('aws-cdk-lib');
const { Stack, Duration, RemovalPolicy, CfnOutput } = require('aws-cdk-lib');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const S3 = require('aws-cdk-lib/aws-s3');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');
const lambda = require('aws-cdk-lib/aws-lambda');
//const sns = require('aws-cdk-lib/aws-sns');
const sqs = require('aws-cdk-lib/aws-sqs');
const cognito = require('aws-cdk-lib/aws-cognito');

//
const lambdaEventSources = require('aws-cdk-lib/aws-lambda-event-sources');
const apigw = require('aws-cdk-lib/aws-apigateway');


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
// DynamoDB Table: Pantry Item
//============================================================================
const table = new dynamodb.Table(this, 'PantryItems', 
  {
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

    const vpc = new ec2.Vpc(this, 'ShelfWatchVPC', { maxAzs: 1 });

    const securityGroup = new ec2.SecurityGroup(this, 'ShelfWatchSG', {
      vpc,
      description: 'Allow HTTP, HTTPS, and SSH',
      allowAllOutbound: true,
    });

    // SSH
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH');
    // HTTP
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');
    // HTTPS
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS');
  
    const websiteAsset = new assets.Asset(this, 'WebsiteAsset', {
      path: 'html', // folder with all HTML/CSS/JS
    });

    const userData = ec2.UserData.forLinux();
    
    userData.addCommands(
        'yum update -y',
        'yum install -y httpd unzip',
        'systemctl enable httpd',
        'systemctl start httpd',
        `aws s3 cp ${websiteAsset.s3ObjectUrl} /tmp/website.zip`,
        'unzip /tmp/website.zip -d /var/www/html',
        'chmod -R 755 /var/www/html'
  );

    const ec2Instance = new ec2.Instance(this, 'ShelfWatchEC2', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup,
      keyName: 'ShelfWatch', 
      userData: userData,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, 
      },
    });

    // Give EC2 permission to read the asset
    websiteAsset.grantRead(ec2Instance.role);

    //===============================================================================
    // S3 Bucket (Food Images)
    //============================================================================
  const bucket = new S3.Bucket(this, 'FoodImages', 
    {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      
    });

    // ===================================================================
    // Cognito User Pool (For ShelfWatch logins)
    // ===================================================================

    // ===================================================================
    // SQS Queue 
    // ===================================================================
    const queue = new sqs.Queue(this, "ShelfWatchQueue", {
      queueName: "ShelfWatchQueue",
      visibilityTimeout: Duration.seconds(30),
    });

    // ===================================================================
    // Lambda Function (Main API Handler)
    // ===================================================================
    const apiHandler = new lambda.Function(this, "ShelfWatchAPI", 
      {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: bucket.bucketName,
        QUEUE_URL: queue.queueUrl,
      }
    });

     // Allow Lambda access
    table.grantReadWriteData(apiHandler);
    bucket.grantReadWrite(apiHandler);
    queue.grantSendMessages(apiHandler);


     // ===================================================================
    // Lambda for Queue Processing (SQS → Lambda)
    // ===================================================================
    const processor = new lambda.Function(this, "ShelfWatchQueueProcessor", 
    {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "processor.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: 
    {
        TABLE_NAME: table.tableName
      }
    });

    processor.addEventSource(new lambdaEventSources.SqsEventSource(queue));
    table.grantReadWriteData(processor);

 // ============================================================
    // API Gateway for Pantry CRUD
    // ============================================================
    const api = new apigw.RestApi(this, 'ShelfWatchAPIEndpoint', 
    {
      restApiName: 'ShelfWatch API',
      description: 'Backend for the ShelfWatch app',
    });

    const items = api.root.addResource('items');
    items.addMethod('GET', new apigw.LambdaIntegration(apiHandler));
    items.addMethod('POST', new apigw.LambdaIntegration(apiHandler));

    const item = items.addResource('{itemId}');
    item.addMethod('PUT', new apigw.LambdaIntegration(apiHandler));
    item.addMethod('DELETE', new apigw.LambdaIntegration(apiHandler));

    // ============================================================
    // Outputs for important resources
    // ============================================================
    new CfnOutput(this, 'ApiURL', { value: api.url });
    new CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    
    
  }
}

module.exports = { ShelfWatchStack }
