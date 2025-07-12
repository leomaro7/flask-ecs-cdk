import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { EcrConstruct } from '../../lib/constructs/ecr-construct';

test('EcrConstruct should create ECR repository with correct configuration', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  
  // WHEN
  const ecrConstruct = new EcrConstruct(stack, 'TestEcrConstruct');
  
  // THEN
  const template = Template.fromStack(stack);
  
  // Verify ECR repository is created
  template.hasResourceProperties('AWS::ECR::Repository', {
    RepositoryName: 'flask-app',
  });
  
  // Verify the repository object is accessible
  expect(ecrConstruct.repository).toBeDefined();
});