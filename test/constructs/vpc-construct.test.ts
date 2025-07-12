import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VpcConstruct } from '../../lib/constructs/vpc-construct';

test('VpcConstruct should create VPC with correct configuration', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  
  // WHEN
  const vpcConstruct = new VpcConstruct(stack, 'TestVpcConstruct');
  
  // THEN
  const template = Template.fromStack(stack);
  
  // Verify VPC is created
  template.hasResourceProperties('AWS::EC2::VPC', {
    CidrBlock: '10.0.0.0/16',
    EnableDnsHostnames: true,
    EnableDnsSupport: true,
  });
  
  // Verify public subnets are created
  template.resourceCountIs('AWS::EC2::Subnet', 2);
  template.hasResourceProperties('AWS::EC2::Subnet', {
    CidrBlock: '10.0.0.0/18',
    MapPublicIpOnLaunch: true,
  });
  
  // Verify Internet Gateway is created
  template.hasResourceProperties('AWS::EC2::InternetGateway', {});
  
  // Verify the VPC object is accessible
  expect(vpcConstruct.vpc).toBeDefined();
});