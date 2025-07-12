import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as FlaskEcsCdk from '../lib/flask-ecs-cdk-stack';

test('Security Group should allow access only from specific IP', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new FlaskEcsCdk.FlaskEcsCdkStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

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
