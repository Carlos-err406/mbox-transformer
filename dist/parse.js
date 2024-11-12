#!/usr/bin/env node
import { Command } from "commander";
import dayjs from "dayjs";
import fs from "fs";
import { parseMboxFile } from "./src/parsers.js";
import { saveThread } from "./src/save-thread.js";
import { sortThread, sortThreadsByFirstMessage } from "./src/utils.js";
const program = new Command();
program
    .option("-i, --input <path>", "input file path")
    .option("-o, --output <path>", "output folder path")
    .option("-m, --min-messages <number>", "Minimum number of messages per thread", "0")
    .option("-t, --max-threads <number>", "Maximum number of threads to save", "Infinity")
    .option("-s, --summarize", "Summarize threads", false)
    .option("-k, --api-key <key>", "API key for AI capabilities")
    .option("-u, --api-url <url>", "Open AI compatible API URL", "https://apigateway.avangenio.net")
    .option("-y, --from-year <year>", "Only get mails from specified year onward")
    .option("-M, --model <model>", "Model to use (e.g. spark)", "spark")
    .parse(process.argv);
const options = program.opts();
const inputFile = String(options.input);
const outputFolder = String(options.output);
const minMessages = Number(options.minMessages);
const maxThreads = Number(options.maxThreads);
const fromYear = Number(options.fromYear);
const summarize = Boolean(options.summarize);
const apiKey = String(options.apiKey);
const apiUrl = String(options.apiUrl);
const model = String(options.model);
console.log({ fromYear });
if (!inputFile || !outputFolder) {
    console.error("Both input and output paths are required.");
    process.exit(1);
}
// Check if outputFolder exists and create it if it doesn't
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
}
else if (!fs.lstatSync(outputFolder).isDirectory()) {
    console.error("Output path is not a directory.");
    process.exit(1);
}
async function main() {
    try {
        const threads = await parseMboxFile(inputFile);
        const threadArray = Array.from(threads.values());
        const sorted = sortThreadsByFirstMessage(threadArray.map(sortThread))
            .filter((thread) => {
            //filter out threads that dont have enough messages
            let keep = thread.length >= minMessages;
            if (!isNaN(fromYear)) {
                //filter out threads that are too old
                const threadYear = thread.reduce((acc, message) => {
                    if (message.date) {
                        const messageDate = dayjs(message.date);
                        if (messageDate.year() < acc) {
                            //set the acc to the oldest year of the thread
                            acc = messageDate.year();
                        }
                    }
                    return acc;
                }, fromYear);
                keep && (keep = threadYear >= fromYear);
            }
            return keep;
        })
            .slice(0, maxThreads); // Add this line to limit threads
        sorted.map((thread, index) => saveThread(thread, index, outputFolder, {
            summarize,
            apiKey,
            apiUrl,
            model,
        }));
        console.log(sorted.length);
    }
    catch (err) {
        console.log(err);
    }
}
main();
