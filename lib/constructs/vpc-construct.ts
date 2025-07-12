import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'FlaskVpc', {
      maxAzs: 2,
      natGateways: 0, // NAT Gatewayを削除
      subnetConfiguration: [
        {
          cidrMask: 18,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ]
    });
  }
}