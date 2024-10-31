export type EmailDetails = {
  subject?: string;
  date?: Date;
  from?: string;
  to: string;
  text: string;
  inReplyTo?: string;
  messageId?: string;
  references: string[];
};
