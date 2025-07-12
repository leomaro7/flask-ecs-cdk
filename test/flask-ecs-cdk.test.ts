import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as FlaskEcsCdk from '../lib/flask-ecs-cdk-stack';

test('Security Group allows traffic only from specific IP', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new FlaskEcsCdk.FlaskEcsCdkStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::EC2::SecurityGroup', {
    GroupDescription: 'Security group for Flask ECS service',
    SecurityGroupIngress: [
      {
        CidrIp: '1.1.1.1/32',
        FromPort: 5000,
        IpProtocol: 'tcp',
        ToPort: 5000
      }
    ]
  });
});
