import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  maxWorkers: 1,
  setupFiles: ["<rootDir>/tests/setup.ts"],
};
export default config;
