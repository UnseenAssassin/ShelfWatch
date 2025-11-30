exports.handler = async (event) => {
  for (const record of event.Records) {
    console.log("Processing SQS Message:", record.body);
  }
  return { statusCode: 200 };
};
