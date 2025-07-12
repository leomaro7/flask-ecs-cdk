import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as FlaskEcsCdk from '../lib/flask-ecs-cdk-stack';

test('FlaskEcsCdkStack should create all required resources', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new FlaskEcsCdk.FlaskEcsCdkStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  // Verify VPC is created
  template.hasResourceProperties('AWS::EC2::VPC', {
    CidrBlock: '10.0.0.0/16',
  });

  // Verify ECR repository is created
  template.hasResourceProperties('AWS::ECR::Repository', {
    RepositoryName: 'flask-app',
  });

  // Verify ECS Cluster is created
  template.hasResourceProperties('AWS::ECS::Cluster', {
    ClusterName: 'flask-cluster',
  });

  // Verify CodePipeline is created
  template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
    Name: 'flask-pipeline',
  });

  // Verify CodeBuild project is created
  template.hasResourceProperties('AWS::CodeBuild::Project', {
    Name: 'flask-build',
  });

  // Verify that the security group allows inbound traffic only from 1.1.1.1/32
  template.hasResourceProperties('AWS::EC2::SecurityGroup', {
    SecurityGroupIngress: [
      {
        IpProtocol: 'tcp',
        FromPort: 5000,
        ToPort: 5000,
        CidrIp: '1.1.1.1/32'
      }
    ]
  });
});
