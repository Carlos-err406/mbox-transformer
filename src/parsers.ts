import fs from "fs";
import { convert } from "html-to-text";
import { simpleParser } from "mailparser";
import { MboxStream } from "node-mbox";
import { EmailDetails } from "./email-details.js";
import { findThreadRoot, removeQuotedText } from "./utils.js";

export async function parseMboxFile(
  inputFile: string
): Promise<Map<string, EmailDetails[]>> {
  return new Promise((resolve, reject) => {
    const mailbox = fs.createReadStream(inputFile);
    const threads = new Map<string, EmailDetails[]>(); // Root message ID as key, list of replies as value
    const messageMap = new Map<string, EmailDetails>(); // Store all messages by Message-ID

    const mbox = MboxStream(mailbox); // It does the same as in 2. case.

    mbox.on("data", async (rawEmail: string) => {
      const email = await parseRawEmail(rawEmail);
      const { inReplyTo, messageId, references } = email;
      if (!messageId) throw new Error("Message-ID is missing");
      // Store each message by its Message-ID
      messageMap.set(messageId, email);
      const threadRoot = findThreadRoot(inReplyTo, messageMap, references);

      if (threadRoot) {
        // Append to an existing thread based on the found root
        if (!threads.has(threadRoot)) {
          threads.set(threadRoot, []);
        }
        threads.get(threadRoot)?.push(email);
      } else {
        // If no root was found, start a new thread with this message as the root
        threads.set(messageId, [email]);
      }
    });

    mbox.on("error", reject);
    mbox.on("finish", () => resolve(threads));
  });
}

export async function parseRawEmail(rawEmail: string): Promise<EmailDetails> {
  const parsedEmail = await simpleParser(rawEmail);
  // Get necessary headers
  const {
    attachments,
    messageId,
    inReplyTo,
    references,
    subject,
    date,
    from,
    to,
    text,
    html,
  } = parsedEmail;

  // Normalize references to an array
  let referenceList: string[] = [];
  if (references) {
    if (Array.isArray(references)) referenceList = references;
    else if (typeof references === "string")
      referenceList = references.split(" ");
  }

  let normalizedTo = "";
  if (to) {
    if (Array.isArray(to)) normalizedTo = to.map((to) => to.text).join(", ");
    else normalizedTo = to.text;
  }

  const plainTextContent =
    text || (html ? convert(html, { wordwrap: false }) : "");

  // Build email details
  const email = {
    attachments,
    subject,
    date,
    inReplyTo,
    messageId,
    from: from?.text,
    to: normalizedTo,
    text: removeQuotedText(plainTextContent),
    references: referenceList,
  };
  return email;
}
