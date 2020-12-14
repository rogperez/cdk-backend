import * as cdk from '@aws-cdk/core';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as route53Targets from '@aws-cdk/aws-route53-targets';

import * as path from 'path';

export interface BackendInfrastructureStackProps extends cdk.StackProps {
  readonly zoneDomainName: string;
  readonly subdomain: string;
}

export class BackendInfrastructureStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: BackendInfrastructureStackProps
  ) {
    super(scope, id, props);

    const { zoneDomainName, subdomain } = props;

    const apiFqdn = `${subdomain}.${zoneDomainName}`;

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: zoneDomainName,
    });

    const certificate = new acm.DnsValidatedCertificate(
      this,
      'APICertificate',
      {
        hostedZone: hostedZone,
        domainName: apiFqdn,
      }
    );

    const lambdaBackend = new lambda.Function(this, 'LambdaAPIBackend', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'backend')),
    });

    const lambdaRestAPI = new apigateway.LambdaRestApi(
      this,
      'LambdaAPIGateway',
      {
        handler: lambdaBackend,
      }
    );

    const apiDomainName = new apigateway.DomainName(this, 'apiDomainName', {
      certificate: certificate,
      domainName: apiFqdn,
    });

    new apigateway.BasePathMapping(this, 'apiBasepathMapping', {
      domainName: apiDomainName,
      restApi: lambdaRestAPI,
    });

    new route53.ARecord(this, 'apiAlias', {
      zone: hostedZone,
      recordName: apiFqdn,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.ApiGatewayDomain(apiDomainName)
      ),
    });
  }
}
