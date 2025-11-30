const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

exports.handler = async (event) => {
  const table = process.env.TABLE_NAME;

  const method = event.httpMethod;

  // GET /items
  if (method === "GET") {
    const data = await db.scan({ TableName: table }).promise();
    return { statusCode: 200, body: JSON.stringify(data.Items) };
  }

  // POST /items
  if (method === "POST") {
    const body = JSON.parse(event.body);
    await db.put({ TableName: table, Item: body }).promise();

    await sqs.sendMessage({
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: JSON.stringify(body),
    }).promise();

    return { statusCode: 200, body: "Item added" };
  }

  return { statusCode: 400, body: "Invalid request" };
};
