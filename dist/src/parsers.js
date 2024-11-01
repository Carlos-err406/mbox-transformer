import fs from "fs";
import { convert } from "html-to-text";
import { simpleParser } from "mailparser";
import { MboxStream } from "node-mbox";
import { findThreadRoot, removeQuotedText } from "./utils.js";
const skipMailsFrom = ["Mail Delivery Subsystem", "Mail Delivery System"];
export async function parseMboxFile(inputFile) {
    return new Promise((resolve, reject) => {
        const mailbox = fs.createReadStream(inputFile);
        const threads = new Map(); // Root message ID as key, list of replies as value
        const messageMap = new Map(); // Store all messages by Message-ID
        const mbox = MboxStream(mailbox); // It does the same as in 2. case.
        mbox.on("data", async (rawEmail) => {
            var _a;
            const email = await parseRawEmail(rawEmail);
            const { inReplyTo, messageId, references, from } = email;
            if (skipMailsFrom.some((mds) => from === null || from === void 0 ? void 0 : from.includes(mds)))
                return; // Skip messages from MDS
            if (!messageId)
                throw new Error("Message-ID is missing");
            // Store each message by its Message-ID
            messageMap.set(messageId, email);
            const threadRoot = findThreadRoot(inReplyTo, messageMap, references);
            if (threadRoot) {
                // Append to an existing thread based on the found root
                if (!threads.has(threadRoot)) {
                    threads.set(threadRoot, []);
                }
                (_a = threads.get(threadRoot)) === null || _a === void 0 ? void 0 : _a.push(email);
            }
            else {
                // If no root was found, start a new thread with this message as the root
                threads.set(messageId, [email]);
            }
        });
        mbox.on("error", reject);
        mbox.on("finish", () => resolve(threads));
    });
}
export async function parseRawEmail(rawEmail) {
    const parsedEmail = await simpleParser(rawEmail);
    // Get necessary headers
    const { attachments, messageId, inReplyTo, references, subject, date, from, to, text, html, } = parsedEmail;
    // Normalize references to an array
    let referenceList = [];
    if (references) {
        if (Array.isArray(references))
            referenceList = references;
        else if (typeof references === "string")
            referenceList = references.split(" ");
    }
    let normalizedTo = "";
    if (to) {
        if (Array.isArray(to))
            normalizedTo = to.map((to) => to.text).join(", ");
        else
            normalizedTo = to.text;
    }
    const base64Regex = /data:[^;]+;base64,[A-Za-z0-9+/=]{4,}/g;
    // Replace all matches with empty string
    const plainTextContent = text || (html ? convert(html, { wordwrap: false }) : "");
    // Build email details
    const email = {
        attachments,
        subject,
        date,
        inReplyTo,
        messageId,
        from: from === null || from === void 0 ? void 0 : from.text,
        to: normalizedTo,
        text: removeQuotedText(plainTextContent.replace(base64Regex, "")),
        references: referenceList,
    };
    return email;
}
