import fs from "fs";
import { EmailDetails } from "./email-details.js";

export const saveThread = (
  thread: EmailDetails[],
  index: number,
  outputFolder: string
) => {
  const folder = `${outputFolder}/${index.toString().padStart(5, "0")}`;
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(
    folder + "/thread.json",
    JSON.stringify(
      thread.map((message) => ({ ...message, attachments: undefined })),
      null,
      2
    )
  );
  console.log(`THREAD: ${folder}/thread.json`);
  thread.map((message) => {
    const { attachments } = message;
    if (attachments.length) {
      attachments.map((attachment) => {
        const { content, filename } = attachment;
        if (!filename) return; //is a mds generated file
        fs.writeFileSync(`${folder}/${filename}`, content);
        console.log(`ATTACHMENT: ${folder}/${filename}`);
      });
    }
  });
};
