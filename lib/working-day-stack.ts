import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as path from "path";

export class WorkingDaysStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const workingDaysFunction = new nodejs.NodejsFunction(
      this,
      "WorkingDaysFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: path.join(__dirname, "../lambda/handlers/workingDays.ts"),
        bundling: {
          minify: false,
          sourceMap: false,
          externalModules: ["@aws-sdk/*"],
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          NODE_ENV: "production",
        },
      }
    );

    const api = new apigateway.RestApi(this, "WorkingDaysApi", {
      restApiName: "Working Days Service",
      description: "API para calcular fechas hábiles en Colombia",
      deployOptions: {
        stageName: "prod",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const workingDaysResource = api.root.addResource("working-days");

    const lambdaIntegration = new apigateway.LambdaIntegration(
      workingDaysFunction,
      {
        proxy: true,
      }
    );

    workingDaysResource.addMethod("GET", lambdaIntegration);

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url + "working-days",
      description: "URL del endpoint de la API",
      exportName: "WorkingDaysApiUrl",
    });
  }
}
