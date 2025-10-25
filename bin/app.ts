#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { WorkingDaysStack } from "../lib/working-day-stack";

const app = new cdk.App();

new WorkingDaysStack(app, "WorkingDaysStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
  description: "Stack para API de cálculo de fechas hábiles en Colombia",
});

app.synth();
