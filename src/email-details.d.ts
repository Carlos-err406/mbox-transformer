import type { Attachment } from "mailparser";
export type EmailDetails = {
  attachments: Attachment[];
  subject?: string;
  date?: Date;
  from?: string;
  to: string;
  text: string;
  inReplyTo?: string;
  messageId?: string;
  references: string[];
};
