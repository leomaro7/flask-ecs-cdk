import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CfnConnection } from 'aws-cdk-lib/aws-codestarconnections';

export interface PipelineConstructProps {
  repository: ecr.Repository;
  service: ecs.FargateService;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
}

export class PipelineConstruct extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly githubConnection: CfnConnection;
  public readonly buildProject: codebuild.Project;

  constructor(scope: Construct, id: string, props: PipelineConstructProps) {
    super(scope, id);

    // CodeBuild Project
    this.buildProject = new codebuild.Project(this, 'FlaskBuildProject', {
      projectName: 'flask-build',
      source: codebuild.Source.gitHub({
        owner: props.githubOwner,
        repo: props.githubRepo,
        // webhook: true, // Temporarily disabled - will be configured via CodePipeline
        // webhookFilters: [
        //   codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(props.githubBranch)
        // ]
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        environmentVariables: {
          AWS_DEFAULT_REGION: {
            value: cdk.Stack.of(this).region
          },
          AWS_ACCOUNT_ID: {
            value: cdk.Stack.of(this).account
          },
          IMAGE_REPO_NAME: {
            value: props.repository.repositoryName
          },
          IMAGE_TAG: {
            value: 'latest'
          }
        }
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml')
    });

    // Grant permissions to CodeBuild
    props.repository.grantPullPush(this.buildProject);
    this.buildProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ecr:GetAuthorizationToken'
      ],
      resources: ['*']
    }));

    // GitHub Connection for CodePipeline
    this.githubConnection = new CfnConnection(this, 'GitHubConnection', {
      connectionName: 'github-connection',
      providerType: 'GitHub'
    });

    // CodePipeline
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    this.pipeline = new codepipeline.Pipeline(this, 'FlaskPipeline', {
      pipelineName: 'flask-pipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeStarConnectionsSourceAction({
              actionName: 'GitHub',
              owner: props.githubOwner,
              repo: props.githubRepo,
              branch: props.githubBranch,
              connectionArn: this.githubConnection.attrConnectionArn,
              output: sourceOutput
            })
          ]
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'CodeBuild',
              project: this.buildProject,
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
              service: props.service,
              input: buildOutput
            })
          ]
        }
      ]
    });
  }
}