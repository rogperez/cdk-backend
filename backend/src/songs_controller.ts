'use strict';

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
  Callback,
} from 'aws-lambda';
import { DynamoDB, AWSError } from 'aws-sdk';
import * as uuid from 'uuid';

const db = new DynamoDB.DocumentClient();

export const get = async function (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  return Promise.resolve({
    statusCode: 200,
    body: 'Hello, world!',
  });
};

export const create = function (
  event: APIGatewayProxyEvent,
  _context: Context,
  callback: Callback
) {
  const tableName = process.env.TABLE_NAME || '';
  const data = JSON.parse(event.body || '');
  const id = uuid.v1();
  const params: DynamoDB.DocumentClient.PutItemInput = {
    TableName: tableName,
    Item: {
      PK: `SONG#${id}`,
      SK: `#METADATA#${id}`,
      Title: data.title,
    },
  };

  db.put(params, (err: AWSError, _res) => {
    if (err) {
      console.error(err);
      callback(
        new Error(`Could not persist item. [${err.message}] (${err.code})`)
      );
      return;
    }

    callback(null, {
      statusCode: 200,
      body: 'Item successfully created',
    });
  });
};
