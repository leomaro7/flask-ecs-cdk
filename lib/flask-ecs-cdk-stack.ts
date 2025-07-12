import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CfnConnection } from 'aws-cdk-lib/aws-codestarconnections';

export class FlaskEcsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // GitHub repository configuration
    const githubOwner = 'leomaro7'; // Replace with your GitHub username
    const githubRepo = 'flask-ecs-cdk';  // Replace with your repository name
    const githubBranch = 'main';                // Replace with your branch name if different

    // VPC
    const vpc = new ec2.Vpc(this, 'FlaskVpc', {
      maxAzs: 2,
      natGateways: 0, // NAT Gatewayを削除
      subnetConfiguration: [
        {
          cidrMask: 18,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ]
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'FlaskCluster', {
      vpc: vpc,
      clusterName: 'flask-cluster'
    });

    // ECR Repository
    const repository = new ecr.Repository(this, 'FlaskRepository', {
      repositoryName: 'flask-app',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'FlaskTaskDefinition', {
      memoryLimitMiB: 512,
      cpu: 256
    });

    // Container Definition
    const container = taskDefinition.addContainer('flask-app', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
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
      vpc: vpc,
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
    const service = new ecs.FargateService(this, 'FlaskService', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      serviceName: 'flask-service',
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    });

    // CodeBuild Project
    const buildProject = new codebuild.Project(this, 'FlaskBuildProject', {
      projectName: 'flask-build',
      source: codebuild.Source.gitHub({
        owner: githubOwner,
        repo: githubRepo,
        // webhook: true, // Temporarily disabled - will be configured via CodePipeline
        // webhookFilters: [
        //   codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(githubBranch)
        // ]
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        environmentVariables: {
          AWS_DEFAULT_REGION: {
            value: this.region
          },
          AWS_ACCOUNT_ID: {
            value: this.account
          },
          IMAGE_REPO_NAME: {
            value: repository.repositoryName
          },
          IMAGE_TAG: {
            value: 'latest'
          }
        }
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml')
    });

    // Grant permissions to CodeBuild
    repository.grantPullPush(buildProject);
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ecr:GetAuthorizationToken'
      ],
      resources: ['*']
    }));

    // GitHub Connection for CodePipeline
    const githubConnection = new CfnConnection(this, 'GitHubConnection', {
      connectionName: 'github-connection',
      providerType: 'GitHub'
    });

    // CodePipeline
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const pipeline = new codepipeline.Pipeline(this, 'FlaskPipeline', {
      pipelineName: 'flask-pipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeStarConnectionsSourceAction({
              actionName: 'GitHub',
              owner: githubOwner,
              repo: githubRepo,
              branch: githubBranch,
              connectionArn: githubConnection.attrConnectionArn,
              output: sourceOutput
            })
          ]
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'CodeBuild',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput]
            })
          ]
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.EcsDeployAction({
              actionName: 'Deploy',
              service: service,
              input: buildOutput
            })
          ]
        }
      ]
    });

    // Outputs
    new cdk.CfnOutput(this, 'GitHubConnectionArn', {
      value: githubConnection.attrConnectionArn,
      description: 'GitHub Connection ARN - Complete setup in AWS Console'
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI'
    });

    new cdk.CfnOutput(this, 'GitHubRepository', {
      value: `https://github.com/${githubOwner}/${githubRepo}`,
      description: 'GitHub Repository URL'
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name'
    });
  }
}