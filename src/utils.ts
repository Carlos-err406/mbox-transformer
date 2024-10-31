import { EmailDetails } from "./email-details.js";
import dayjs from "dayjs";

export function removeQuotedText(text: string) {
  // Match reply patterns in both English and Spanish
  const replyPattern =
    /(^|\n)(From:.*|Sent:.*|On.*wrote:|De:.*|Enviado el:.*|Para:.*|Asunto:.*|> .*)/is;
  return text; //.replace(replyPattern, "").trim(); // Remove matching parts
}

export function sortThread(thread: EmailDetails[]) {
  return thread.sort(({ date: dateA }, { date: dateB }) => {
    const a = dayjs(dateA);
    const b = dayjs(dateB);
    if (!dateA || !dateB || a.isSame(b)) return 0;
    else if (a.isBefore(b)) return -1;
    else return 1;
  });
}

export function sortThreadsByFirstMessage(threads: EmailDetails[][]) {
  return threads.sort((threadA, threadB) => {
    const dateA = threadA[0].date;
    const dateB = threadB[0].date;
    const a = dayjs(dateA);
    const b = dayjs(dateB);
    if (!dateA || !dateB || a.isSame(b)) return 0;
    else if (a.isBefore(b)) return -1;
    else return 1;
  });
}

// Helper to find the root message of a thread
export function findThreadRoot(
  inReplyTo: string | undefined,
  messageMap: Map<string, EmailDetails>,
  references: string[]
): string | undefined {
  // Check through references in order to locate the earliest existing message in the thread
  for (const ref of references) {
    if (messageMap.has(ref)) {
      return ref;
    }
  }
  // If references are not found, fall back to `inReplyTo` as the root if it exists
  return inReplyTo && messageMap.has(inReplyTo) ? inReplyTo : undefined;
}
