export type Tag = {
  id: string;
  name: string;
  _count?: { contacts: number };
};

export type ContactList = {
  id: string;
  name: string;
  _count?: { members: number };
};

export type Contact = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  city?: string | null;
  country?: string | null;
  status: "ACTIVE" | "ARCHIVED";
  emailOptIn: boolean;
  whatsappOptIn: boolean;
  createdAt: string;
  tags: { tag: Tag }[];
  listMemberships?: { contactList: ContactList }[];
};

export type ContactListResponse = {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
};
