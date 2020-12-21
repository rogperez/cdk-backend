import * as cdk from '@aws-cdk/core';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as route53Targets from '@aws-cdk/aws-route53-targets';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

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
     * DyanamoDB
     */
    const table = new dynamodb.Table(this, 'AmazingSongs', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    /*
     * Rest API
     */
    const api = new apigateway.RestApi(this, 'SongsAPI', {
      deployOptions: {
        loggingLevel: apigateway.MethodLoggingLevel.ERROR,
      },
    });
    const songs = api.root.addResource('songs');

    // Lambda Fn Defaults
    // Lambda nodejs layer (node_modules as Lambda Layer)
    const layer = new lambda.LayerVersion(this, 'SongsDependencyLayer', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', '..', 'backend', 'layers')
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X],
      description: 'NodeJS Dependencies for Songs API',
    });

    const codeAsset = lambda.Code.fromAsset(
      path.join(__dirname, '..', '..', 'backend', 'build')
    );
    const lambdaFnProps: lambda.FunctionProps = {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: codeAsset,
      environment: {
        TABLE_NAME: table.tableName,
      },
      layers: [layer],
      handler: '',
    };

    // Get
    const getSongsFunction = new lambda.Function(this, 'SongsGetFunction', {
      ...lambdaFnProps,
      handler: 'songs_controller.get',
    });
    const getSongsIntegration = new apigateway.LambdaIntegration(
      getSongsFunction
    );
    songs.addMethod('GET', getSongsIntegration);

    // Create
    const createSongsFunction = new lambda.Function(
      this,
      'SongsCreateFunction',
      {
        ...lambdaFnProps,
        handler: 'songs_controller.create',
      }
    );
    const createSongsIntegration = new apigateway.LambdaIntegration(
      createSongsFunction
    );
    songs.addMethod('POST', createSongsIntegration);

    /*
     * Assign Permissions
     */
    table.grantReadWriteData(createSongsFunction);
    table.grantReadData(getSongsFunction);

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
