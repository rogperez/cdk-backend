import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { BackendInfrastructureStack } from '../lib/backend-infrastructure-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN

  const stack = new BackendInfrastructureStack(app, 'MyTestStack', {
    env: {
      account: '123456890',
      region: 'us-east-1',
    },
    zoneDomainName: 'foo',
    subdomain: 'bar',
  });

  // THEN
  expectCDK(stack).to(haveResource('AWS::DynamoDB::Table'));
});
