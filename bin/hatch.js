#!/usr/bin/env node
const { HatchCLI } = require("../dist/cli/hatch");

const cli = new HatchCLI();
cli.runCommand(process.argv.slice(2));