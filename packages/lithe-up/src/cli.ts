#!/usr/bin/env node

import { Command } from "commander";
import { litheUp } from "./create-app";
import { readFileSync } from "fs";
import { join } from "path";

const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf8")
);

const program = new Command();

program
  .name("lithe-up")
  .description("Create a new lithejs application")
  .version(packageJson.version);

program
  .argument("[project-name]", "Name of the project")
  .option("-t, --template <template>", "Template to use (basic, blank)")
  .action(async (projectName?: string, options?: { template?: string }) => {
    try {
      await litheUp(projectName, options?.template);
    } catch (error) {
      console.error("Error creating lithejs app:", error);
      process.exit(1);
    }
  });

program.parse();
