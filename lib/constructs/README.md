# CDK Constructs

This directory contains focused AWS CDK Constructs that improve code organization and readability.

## Structure

- **`vpc-construct.ts`**: VPC infrastructure including subnets and networking configuration
- **`ecr-construct.ts`**: ECR repository setup for container images
- **`ecs-construct.ts`**: ECS cluster, task definition, service, and security group configuration
- **`pipeline-construct.ts`**: CI/CD pipeline including CodePipeline, CodeBuild, and GitHub connection

## Benefits

- **Improved Readability**: Each construct has a single responsibility
- **Better Organization**: Related resources are grouped together
- **Reusability**: Constructs can be reused in other projects
- **Testability**: Each construct can be tested independently
- **Maintainability**: Changes to one area are isolated

## Usage

Each construct exposes the necessary properties and objects through public readonly fields, allowing the main stack to use the outputs of one construct as inputs to another.