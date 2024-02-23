import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {aws_s3 as s3, Duration} from 'aws-cdk-lib';
import {CachePolicy, Distribution, OriginAccessIdentity} from "aws-cdk-lib/aws-cloudfront";
import {S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";

export class HelloWorldCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'TestBucket', {
      versioned: true
    });
    const bucketCloudFrontOAI= new OriginAccessIdentity(this, 'bucketCloudFrontOAI', {
      comment: 'Allows CloudFront to access Bucket',
    });
    const bucketCFCachePolicy = new CachePolicy(this, 'bucketCFCachePolicy', {
      maxTtl: Duration.seconds(15),
      defaultTtl: Duration.seconds(15),
    });
    const bucketDistributionOrigin = new S3Origin(bucket, {
      originAccessIdentity: bucketCloudFrontOAI,
    });
    const bucketEndpoint = new Distribution(this, 'bucketDistribution', {
      defaultBehavior: {
        origin: bucketDistributionOrigin,
        cachePolicy: bucketCFCachePolicy,
      },
    });
    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 3 // Default is all AZs in region
    });
    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc: vpc
    });
    // Create a load-balanced Fargate service and make it public
    new ecs_patterns.ApplicationLoadBalancedFargateService(this, "MyFargateService", {
      cluster: cluster, // Required
      cpu: 512, // Default is 256
      desiredCount: 6, // Default is 1
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("public.ecr.aws/amazonlinux/amazonlinux:latest"),
        environment: {
          BUCKET_ENDPOINT: bucketEndpoint.distributionDomainName
        }
      },
      memoryLimitMiB: 2048, // Default is 512
      publicLoadBalancer: true, // Default is true
    });
  }
}
