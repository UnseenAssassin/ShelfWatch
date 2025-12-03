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
    

//Last Second Addition: Calculate expiration status
const today = new Date().toISOString().slice(0, 10);

    const items = data.Items.map(item => {
      let daysLeft = null;
      let isExpired = false;
      let expiringSoon = false;

      if (item.expirationDate) {
        const diffDays = Math.ceil(
          (new Date(item.expirationDate) - new Date(today)) /
          (1000 * 60 * 60 * 24)
        );

        daysLeft = diffDays;
        isExpired = diffDays < 0;
        expiringSoon = diffDays >= 0 && diffDays <= 2;
      }

      return {
        ...item,
        daysLeft,        
        isExpired,       
        expiringSoon     
      };
    });
//Last Second Addition End


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
