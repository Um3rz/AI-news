import {
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
  CfnOutput,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as ecs_patterns,
  aws_iam as iam,
  aws_logs as logs,
  aws_rds as rds,
  aws_secretsmanager as secretsmanager,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class NewscuratorStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Read context params
    const imageUri = this.node.tryGetContext('imageUri');
    const nextAuthUrl = this.node.tryGetContext('nextAuthUrl') as string | undefined;

    if (!imageUri) {
      throw new Error('Missing context: imageUri. Pass with -c imageUri="<account>.dkr.ecr.<region>.amazonaws.com/<repo>:<tag>"');
    }

    // VPC with public + private subnets, 1 NAT (cost optimized)
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC },
        { name: 'private-egress', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      ],
    });

    // RDS Postgres with Secrets Manager credentials
    const dbSecret = new rds.DatabaseSecret(this, 'DbSecret', { username: 'postgres' });

    const db = new rds.DatabaseInstance(this, 'Postgres', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      multiAz: false,
      publiclyAccessible: false,
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: 'appdb',
      removalPolicy: RemovalPolicy.SNAPSHOT,
      backupRetention: Duration.days(7),
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    // Logs
    const logGroup = new logs.LogGroup(this, 'AppLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
    });

    // Task role permissions (allow reading secrets)
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
      resources: ['*'],
    }));

    // Execution role (pull from ECR, create logs)
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    const containerImage = ecs.ContainerImage.fromRegistry(imageUri);

    // Application Load Balanced Fargate Service
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 2,
      publicLoadBalancer: true,
      taskImageOptions: {
        image: containerImage,
        containerPort: 3000,
        enableLogging: true,
        taskRole,
        executionRole,
        environment: {
          NODE_ENV: 'production',
          ...(nextAuthUrl ? { NEXTAUTH_URL: nextAuthUrl } : {}),
        },
        secrets: {
          // Provide your secrets by name from Secrets Manager
          NEXTAUTH_SECRET: ecs.Secret.fromSecretsManager(
            secretsmanager.Secret.fromSecretNameV2(this, 'NextAuthSecret', 'app/newscurator/NEXTAUTH_SECRET')
          ),
          OPENAI_API_KEY: ecs.Secret.fromSecretsManager(
            secretsmanager.Secret.fromSecretNameV2(this, 'OpenAIKey', 'app/newscurator/OPENAI_API_KEY')
          ),
          DATABASE_URL: ecs.Secret.fromSecretsManager(
            secretsmanager.Secret.fromSecretNameV2(this, 'DatabaseUrl', 'app/newscurator/DATABASE_URL')
          ),
        },
        logDriver: ecs.LogDriver.awsLogs({
          streamPrefix: 'next',
          logGroup,
        }),
      },
      healthCheckGracePeriod: Duration.seconds(60),
    });

    // Allow ECS tasks to reach the DB
    db.connections.allowFrom(fargateService.service, ec2.Port.tcp(5432), 'ECS to RDS');

    // Target group health check
    fargateService.targetGroup.configureHealthCheck({
      path: '/api/health',
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
      interval: Duration.seconds(30),
      timeout: Duration.seconds(5),
    });

    // Auto scaling
    const scaling = fargateService.service.autoScaleTaskCount({ minCapacity: 2, maxCapacity: 6 });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    // Outputs
    new CfnOutput(this, 'AlbDns', { value: `http://${fargateService.loadBalancer.loadBalancerDnsName}` });
    new CfnOutput(this, 'RdsEndpoint', { value: db.instanceEndpoint.hostname });
    new CfnOutput(this, 'ClusterName', { value: cluster.clusterName });
    new CfnOutput(this, 'ServiceName', { value: fargateService.service.serviceName });
  }
}
