#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs";
import { parseMboxFile } from "./src/parsers.js";
import { sortThread, sortThreadsByFirstMessage } from "./src/utils.js";
import PQueue from "p-queue";
const program = new Command();

program
  .option("-i, --input <path>", "input file path")
  .option("-o, --output <path>", "output folder path")
  .parse(process.argv);

const options = program.opts();
const inputFile = options.input;
const outputFolder = options.output;

if (!inputFile || !outputFolder) {
  console.error("Both input and output paths are required.");
  process.exit(1);
}

// Check if outputFolder exists and create it if it doesn't
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
} else if (!fs.lstatSync(outputFolder).isDirectory()) {
  console.error("Output path is not a directory.");
  process.exit(1);
}

async function main() {
  try {
    const threads = await parseMboxFile(inputFile);
    const threadArray = Array.from(threads.values());

    const sorted = sortThreadsByFirstMessage(threadArray.map(sortThread));
    const queue = new PQueue({ concurrency: 5 }); // adjust concurrency as needed
    sorted.map((thread, index) => {
      const filename = `${outputFolder}/${index
        .toString()
        .padStart(10, "0")}.json`;
      console.log(filename);
      queue.add(() =>
        fs.writeFileSync(filename, JSON.stringify(thread, null, 2))
      );
    });
    await queue.onIdle();
    console.log(sorted.length);
  } catch (err) {
    console.log(err);
  }
}

main();
