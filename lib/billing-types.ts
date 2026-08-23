export type PlanKey = "free" | "starter" | "business" | "pro";

export type PlanCatalogItem = {
  key: PlanKey;
  name: string;
  pricePaise: number;
  contactsLimit: number;
  emailLimit: number;
  whatsappLimit: number;
  socialEnabled: boolean;
};

export type BillingInfo = {
  plan: PlanCatalogItem;
  renewsAt: string | null;
  pendingPlanName: string | null;
  usage: {
    contactsCount: number;
    emailAccountsCount: number;
    emailsSent: number;
    whatsappSent: number;
  };
  plans: PlanCatalogItem[];
};

export function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}
