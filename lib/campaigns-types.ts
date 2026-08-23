export type CampaignChannel = "EMAIL" | "WHATSAPP";
export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "QUEUED"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type Campaign = {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  listId: string | null;
  tagId: string | null;
  emailAccountId: string | null;
  emailTemplateId: string | null;
  subject: string | null;
  bodyHtml: string | null;
  whatsappAccountId: string | null;
  whatsappTemplateId: string | null;
  templateVariableMap: Record<string, string> | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { recipients: number };
};

export type CampaignRecipientStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "BOUNCED"
  | "UNSUBSCRIBED";

export type CampaignRecipient = {
  id: string;
  status: CampaignRecipientStatus;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  contact: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
};

export type CampaignDetail = Campaign & {
  emailAccount?: { emailAddress: string } | null;
  emailTemplate?: { name: string } | null;
  whatsappAccount?: { displayPhoneNumber: string } | null;
  whatsappTemplate?: { name: string } | null;
  list?: { name: string } | null;
  tag?: { name: string } | null;
  recipientCounts: Record<string, number>;
};

export type EmailAccount = {
  id: string;
  emailAddress: string;
  displayName?: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
};

export type WhatsAppAccount = {
  id: string;
  businessAccountId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  businessName?: string | null;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
};

export type WhatsAppTemplate = {
  id: string;
  whatsappAccountId: string;
  name: string;
  language: string;
  bodyText: string;
  variableCount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "DISABLED";
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
};

export type ContactList = { id: string; name: string };
export type Tag = { id: string; name: string };
