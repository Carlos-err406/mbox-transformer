import fs from "fs";
import { summarizeThread } from "./summarize-thread.js";
export const saveThread = async (thread, index, outputFolder, ai) => {
    const folder = `${outputFolder}/${index.toString().padStart(5, "0")}`;
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(folder + "/thread.json", JSON.stringify(thread.map((message) => ({ ...message, attachments: undefined })), null, 2));
    console.log(`THREAD: ${folder}/thread.json`);
    thread.map((message) => {
        const { attachments } = message;
        if (attachments.length) {
            attachments.map((attachment) => {
                const { content, filename } = attachment;
                if (!filename)
                    return; //is a mds generated file
                fs.writeFileSync(`${folder}/${filename}`, content);
                console.log(`ATTACHMENT: ${folder}/${filename}`);
            });
        }
    });
    if (ai.summarize) {
        const summary = await summarizeThread(ai, thread);
        if (summary) {
            fs.writeFileSync(`${folder}/summary.txt`, summary);
            console.log(`SUMMARY: ${folder}/summary.txt`);
        }
    }
};
