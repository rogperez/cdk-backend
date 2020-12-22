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
const tableName = process.env.TABLE_NAME || '';

export const get = function (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback
) {
  db.query(
    {
      TableName: tableName,
      KeyConditionExpression: '#PK = :PK',
      ExpressionAttributeNames: { '#PK': 'PK' },
      ExpressionAttributeValues: {
        ':PK': 'SONG',
      },
    },
    (error: AWSError, data) => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(data),
      });
    }
  );
};

export const create = function (
  event: APIGatewayProxyEvent,
  _context: Context,
  callback: Callback
) {
  const data = JSON.parse(event.body || '');
  const id = uuid.v1();
  const params: DynamoDB.DocumentClient.PutItemInput = {
    TableName: tableName,
    Item: {
      PK: `SONG`,
      SK: `#METADATA#${id}`,
      SongID: id,
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
