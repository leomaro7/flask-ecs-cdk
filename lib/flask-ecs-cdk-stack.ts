import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';

export class FlaskEcsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'FlaskVpc', {
      maxAzs: 2,
      natGateways: 1
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

    // CodeCommit Repository
    const codeRepository = new codecommit.Repository(this, 'FlaskCodeRepository', {
      repositoryName: 'flask-app-source',
      description: 'Flask application source code'
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

    // ECS Service
    const service = new ecs.FargateService(this, 'FlaskService', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      serviceName: 'flask-service'
    });

    // CodeBuild Project
    const buildProject = new codebuild.Project(this, 'FlaskBuildProject', {
      projectName: 'flask-build',
      source: codebuild.Source.codeCommit({
        repository: codeRepository
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

    // CodePipeline
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const pipeline = new codepipeline.Pipeline(this, 'FlaskPipeline', {
      pipelineName: 'flask-pipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit',
              repository: codeRepository,
              output: sourceOutput,
              branch: 'main'
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
    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI'
    });

    new cdk.CfnOutput(this, 'CodeCommitRepositoryCloneUrl', {
      value: codeRepository.repositoryCloneUrlHttp,
      description: 'CodeCommit Repository Clone URL'
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name'
    });
  }
}
