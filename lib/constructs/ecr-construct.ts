import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as cdk from 'aws-cdk-lib';

export class EcrConstruct extends Construct {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.repository = new ecr.Repository(this, 'FlaskRepository', {
      repositoryName: 'flask-app',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  }
}