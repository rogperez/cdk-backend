# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

Context params: `-c account_id=12345 -c zome_domain_name=foo.com --profile my-aws-profile`

- `yarn cdk synth -c account_id=12345 -c zome_domain_name=foo.com --profile my-aws-profile` emits the synthesized CloudFormation template
- `yarn cdk diff -c account_id=12345 -c zome_domain_name=foo.com --profile my-aws-profile` compare deployed stack with current state
- `yarn cdk deploy -c account_id=12345 -c zome_domain_name=foo.com --profile my-aws-profile` deploy this stack to your default AWS account/region
