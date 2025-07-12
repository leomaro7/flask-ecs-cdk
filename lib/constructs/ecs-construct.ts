import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export interface EcsConstructProps {
  vpc: ec2.Vpc;
  repository: ecr.Repository;
}

export class EcsConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'FlaskCluster', {
      vpc: props.vpc,
      clusterName: 'flask-cluster'
    });

    // Task Definition
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'FlaskTaskDefinition', {
      memoryLimitMiB: 512,
      cpu: 256
    });

    // Container Definition
    const container = this.taskDefinition.addContainer('flask-app', {
      image: ecs.ContainerImage.fromEcrRepository(props.repository, 'latest'),
      memoryLimitMiB: 512,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'flask-app'
      }),
      environment: {
        PORT: '5000'
      }
    });

    container.addPortMappings({
      containerPort: 5000,
      protocol: ecs.Protocol.TCP
    });

    // Security Group for ECS Service
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Flask ECS service',
      allowAllOutbound: true
    });

    // Allow inbound traffic on port 5000 from specific IP only
    ecsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('1.1.1.1/32'),
      ec2.Port.tcp(5000),
      'Allow HTTP traffic on port 5000'
    );

    // ECS Service
    this.service = new ecs.FargateService(this, 'FlaskService', {
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      serviceName: 'flask-service',
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    });
  }
}