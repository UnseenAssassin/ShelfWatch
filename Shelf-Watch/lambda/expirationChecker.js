const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async () => {
  const table = process.env.TABLE_NAME;
  
  const today = new Date().toISOString().slice(0, 10);
  console.log("Running expiration check for:", today);

  try {
    // Scans all items in the database 
    const data = await db.scan({ TableName: table }).promise();

    const expired = data.Items.filter(item =>
      item.expirationDate && item.expirationDate < today
    );

    const soonExpiring = data.Items.filter(item =>
      item.expirationDate &&
      item.expirationDate >= today &&
      (
        (new Date(item.expirationDate) - new Date(today)) /
        (1000 * 60 * 60 * 24)
      ) <= 2
    );

    console.log("Expired items:", expired);
    console.log("Expiring soon:", soonExpiring);

    for (const item of expired) {
      await db.update({
        TableName: table,
        Key: { itemId: item.itemId },
        UpdateExpression: "set isExpired = :t",
        ExpressionAttributeValues: { ":t": true }
      }).promise();
    }

    return { statusCode: 200, body: "Expiration check complete." };

  } catch (err) {
    console.error("Error checking expiration:", err);
    return { statusCode: 500, body: "Error processing expiration check." };
  }
};
