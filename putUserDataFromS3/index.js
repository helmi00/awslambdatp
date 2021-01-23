const AWS = require("aws-sdk");

const s3 = new AWS.S3();

const documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { name } = event.Records[0].s3.bucket;
  const { key } = event.Records[0].s3.object;

  const getObjectparams = {
    Bucket: name,
    Key: key,
  };

  let statusCode = 0;
  let responseBody = "";

  try {
    const s3Data = await s3.getObject(getObjectparams).promise();
    const usersStr = s3Data.Body.toString();
    const usersJSON = JSON.parse(usersStr);
    await Promise.all(
      usersJSON.map(async (user) => {
        const { id, firstname, lastname } = user;

        const putParams = {
          TableName: "Users",
          Item: {
            id: id,
            firstname: firstname,
            lastname: lastname,
          },
        };
        try {
          const putItemData = await documentClient.put(putParams).promise();
        } catch (error) {
          responseBody = "Can't put users in DynamoDB";
          statusCode = 403;
          console.log(error);
        }
      })
    );

    responseBody = "Succeeded putting users in DynamoDB";
    statusCode = 201;
  } catch (error) {
    responseBody = "Can't get users from s3";
    statusCode = 403;
    console.log(error);
  }
  const response = {
    statusCode: statusCode,
    body: responseBody,
  };
  return response;
};
