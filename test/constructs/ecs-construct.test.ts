import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VpcConstruct } from '../../lib/constructs/vpc-construct';
import { EcrConstruct } from '../../lib/constructs/ecr-construct';
import { EcsConstruct } from '../../lib/constructs/ecs-construct';

test('EcsConstruct should create ECS resources with security group configuration', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  
  // GIVEN
  const vpcConstruct = new VpcConstruct(stack, 'TestVpcConstruct');
  const ecrConstruct = new EcrConstruct(stack, 'TestEcrConstruct');
  
  // WHEN
  const ecsConstruct = new EcsConstruct(stack, 'TestEcsConstruct', {
    vpc: vpcConstruct.vpc,
    repository: ecrConstruct.repository,
  });
  
  // THEN
  const template = Template.fromStack(stack);
  
  // Verify ECS Cluster is created
  template.hasResourceProperties('AWS::ECS::Cluster', {
    ClusterName: 'flask-cluster',
  });
  
  // Verify Task Definition is created
  template.hasResourceProperties('AWS::ECS::TaskDefinition', {
    Cpu: '256',
    Memory: '512',
    NetworkMode: 'awsvpc',
    RequiresCompatibilities: ['FARGATE'],
  });
  
  // Verify Service is created
  template.hasResourceProperties('AWS::ECS::Service', {
    ServiceName: 'flask-service',
    DesiredCount: 1,
  });
  
  // Verify Security Group allows access only from specific IP
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
  
  // Verify the objects are accessible
  expect(ecsConstruct.cluster).toBeDefined();
  expect(ecsConstruct.service).toBeDefined();
  expect(ecsConstruct.taskDefinition).toBeDefined();
});