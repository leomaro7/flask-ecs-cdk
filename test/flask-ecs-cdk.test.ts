import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as FlaskEcsCdk from '../lib/flask-ecs-cdk-stack';

test('Security group restricts access to specific IP', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new FlaskEcsCdk.FlaskEcsCdkStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::EC2::SecurityGroup', {
    SecurityGroupIngress: [
      {
        CidrIp: '1.1.1.1/32',
        Description: 'Allow HTTP traffic on port 5000 from specific IP',
        FromPort: 5000,
        ToPort: 5000,
        IpProtocol: 'tcp'
      }
    ]
  });
});

// Original placeholder test
test('SQS Queue Created', () => {
//   const app = new cdk.App();
//     // WHEN
//   const stack = new FlaskEcsCdk.FlaskEcsCdkStack(app, 'MyTestStack');
//     // THEN
//   const template = Template.fromStack(stack);

//   template.hasResourceProperties('AWS::SQS::Queue', {
//     VisibilityTimeout: 300
//   });
});
