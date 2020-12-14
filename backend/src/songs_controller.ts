import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const get = async function (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  return Promise.resolve({
    statusCode: 200,
    body: 'Hello, world!',
  });
};
