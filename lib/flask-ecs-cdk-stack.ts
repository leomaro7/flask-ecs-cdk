import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct, EcrConstruct, EcsConstruct, PipelineConstruct } from './constructs';

export class FlaskEcsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // GitHub repository configuration
    const githubOwner = 'leomaro7'; // Replace with your GitHub username
    const githubRepo = 'flask-ecs-cdk';  // Replace with your repository name
    const githubBranch = 'main';                // Replace with your branch name if different

    // Create VPC infrastructure
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct');

    // Create ECR repository
    const ecrConstruct = new EcrConstruct(this, 'EcrConstruct');

    // Create ECS cluster and service
    const ecsConstruct = new EcsConstruct(this, 'EcsConstruct', {
      vpc: vpcConstruct.vpc,
      repository: ecrConstruct.repository,
    });

    // Create CI/CD pipeline
    const pipelineConstruct = new PipelineConstruct(this, 'PipelineConstruct', {
      repository: ecrConstruct.repository,
      service: ecsConstruct.service,
      githubOwner,
      githubRepo,
      githubBranch,
    });

    // Outputs
    new cdk.CfnOutput(this, 'GitHubConnectionArn', {
      value: pipelineConstruct.githubConnection.attrConnectionArn,
      description: 'GitHub Connection ARN - Complete setup in AWS Console'
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: ecrConstruct.repository.repositoryUri,
      description: 'ECR Repository URI'
    });

    new cdk.CfnOutput(this, 'GitHubRepository', {
      value: `https://github.com/${githubOwner}/${githubRepo}`,
      description: 'GitHub Repository URL'
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: ecsConstruct.cluster.clusterName,
      description: 'ECS Cluster Name'
    });
  }
}