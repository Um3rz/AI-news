# Newscurator Infra (AWS CDK v2)

This CDK app provisions:

- VPC (2 AZs, 1 NAT)
- RDS PostgreSQL (private)
- ECS Fargate service behind an Application Load Balancer
- CloudWatch logs
- Autoscaling
- Secrets wiring for `DATABASE_URL`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`

## Prerequisites

- AWS CLI configured (`aws configure`)
- Node 18+
- AWS CDK v2 (`npm i -g aws-cdk@latest`)
- Docker image pushed to ECR

## Setup

```bash
cd infra
npm install
```

## Required Secrets (Secrets Manager)

Create or update these secret names in Secrets Manager (region consistent with deploy):

- `app/newscurator/NEXTAUTH_SECRET`
- `app/newscurator/OPENAI_API_KEY`
- `app/newscurator/DATABASE_URL` (create after RDS is created and you know the hostname)

Example (PowerShell):

```powershell
$Region = "us-east-1"
$NEXTAUTH_SECRET = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
aws secretsmanager create-secret --name app/newscurator/NEXTAUTH_SECRET --secret-string $NEXTAUTH_SECRET --region $Region 2>$null; if ($LASTEXITCODE -ne 0) { aws secretsmanager put-secret-value --secret-id app/newscurator/NEXTAUTH_SECRET --secret-string $NEXTAUTH_SECRET --region $Region }

$OPENAI_API_KEY = "<your-openai-api-key>"
aws secretsmanager create-secret --name app/newscurator/OPENAI_API_KEY --secret-string $OPENAI_API_KEY --region $Region 2>$null; if ($LASTEXITCODE -ne 0) { aws secretsmanager put-secret-value --secret-id app/newscurator/OPENAI_API_KEY --secret-string $OPENAI_API_KEY --region $Region }
```

## Bootstrap

```bash
cd infra
npx cdk bootstrap
```

## Deploy (first time)

Pass your image URI (from ECR) and optionally NEXTAUTH_URL as context:

```bash
npx cdk deploy -c imageUri="<account>.dkr.ecr.<region>.amazonaws.com/next-prisma:<tag>" -c nextAuthUrl="https://<your-domain-or-alb>" --require-approval never
```

Outputs will include:

- `AlbDns` – public URL to test `/api/health`
- `RdsEndpoint` – hostname for your DATABASE_URL

## Create DATABASE_URL Secret

After deploy, create the `DATABASE_URL` using the RDS endpoint and the DB credentials stored by CDK:

```powershell
$Region = "us-east-1"
$DbName = "appdb"
$DbSecretName = "<db-secret-name as seen in AWS Console or CDK outputs if named>"
$DbCreds = aws secretsmanager get-secret-value --secret-id $DbSecretName --region $Region | jq -r .SecretString | jq -r .
$DbUser = ($DbCreds | ConvertFrom-Json).username
$DbPass = ($DbCreds | ConvertFrom-Json).password
$DbHost = "<rds-endpoint-from-output>"
$DbPort = 5432
$DATABASE_URL = "postgres://$DbUser:$DbPass@$DbHost:$DbPort/$DbName"
aws secretsmanager create-secret --name app/newscurator/DATABASE_URL --secret-string $DATABASE_URL --region $Region 2>$null; if ($LASTEXITCODE -ne 0) { aws secretsmanager put-secret-value --secret-id app/newscurator/DATABASE_URL --secret-string $DATABASE_URL --region $Region }
```

## Redeploy with Secrets Wired

If you created `DATABASE_URL` after the first deploy, the task is already expecting this secret name. Force a new deployment to pick up the secret value:

```bash
npx cdk deploy -c imageUri="<account>.dkr.ecr.<region>.amazonaws.com/next-prisma:<tag>" -c nextAuthUrl="https://<your-domain-or-alb>" --require-approval never
```

Or force new ECS deployment:

```bash
aws ecs update-service --cluster <ClusterName> --service <ServiceName> --force-new-deployment --region <region>
```

## Health Check

- ALB health check path is `/api/health`.
- Check app logs in CloudWatch Log Group output by the stack.

## Next Steps

- Add one-off ECS Task for `npx prisma migrate deploy` and trigger it from CI before updating the service.
- Add CloudWatch alarms and SNS notifications.
- Consider WAF on the ALB for additional protection.
