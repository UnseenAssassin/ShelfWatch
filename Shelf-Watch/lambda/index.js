const AWS = require("aws-sdk");
const crypto = require("crypto"); // for generating an ItemID
const db = new AWS.DynamoDB.DocumentClient();
//const sqs = new AWS.SQS();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const table = process.env.TABLE_NAME;
  const bucket = process.env.BUCKET_NAME;
  const method = event.httpMethod;
  const path = event.resource;

  // POST /presign
  if (method === "POST" && path === "/presign") {
    const body = JSON.parse(event.body);
    const s3Key = `${Date.now()}_${body.filename}`;
    
    const uploadUrl = s3.getSignedUrl("putObject", {
      Bucket: bucket,
      Key: s3Key,
      ContentType: body.contentType,
      Expires: 300,
    });

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ uploadUrl, s3Key }),
    };
  }

  // GET /items
  if (method === "GET") {
    const data = await db.scan({ TableName: table }).promise();
    return { 
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data.Items),
    };
  }

  // POST /items
  if (method === "POST" && path === "/items") {
    const body = JSON.parse(event.body);
    body.itemId = crypto.randomUUID();
    await db.put({ TableName: table, Item: body }).promise();

    //await sqs.sendMessage({
      ///QueueUrl: process.env.QUEUE_URL,
      //MessageBody: JSON.stringify(body),
    //}).promise();

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "Item added",
    };
  }

  return {
    statusCode: 400,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: "Invalid request",
  };
};
