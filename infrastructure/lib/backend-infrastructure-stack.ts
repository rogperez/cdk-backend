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

    /*
     * Rest API
     */
    const getSongsFunction = new lambda.Function(this, 'SongsGetFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', '..', 'backend', 'build')
      ),
      handler: 'songs_controller.get',
    });
    const getSongsIntegration = new apigateway.LambdaIntegration(
      getSongsFunction
    );
    const api = new apigateway.RestApi(this, 'SongsAPI', {
      deployOptions: {
        loggingLevel: apigateway.MethodLoggingLevel.ERROR,
      },
    });
    const songs = api.root.addResource('songs');
    songs.addMethod('GET', getSongsIntegration);

    /*
     * Domain
     */
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

    const apiDomainName = new apigateway.DomainName(this, 'APIDomainName', {
      certificate: certificate,
      domainName: apiFqdn,
      mapping: api,
    });

    new route53.ARecord(this, 'APIAlias', {
      zone: hostedZone,
      recordName: apiFqdn,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.ApiGatewayDomain(apiDomainName)
      ),
    });
  }
}
