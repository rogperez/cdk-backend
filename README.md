# Getting Started

## Building the backend

```
cd backend
yarn install
yarn build
```

## Deploying Infrastructure

```
cd infrastructure
yarn cdk synth -c account_id=12345 -c zome_domain_name=foo.com --profile my-aws-profile
yarn cdk deploy -c account_id=12345 -c zome_domain_name=foo.com --profile my-aws-profile
```
