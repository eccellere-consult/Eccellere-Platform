/**
 * The ONE catalogue of admin screens. The side menu, the breadcrumb and the Stage strip all read from here, and a test fails when an admin
 * screen exists that is not listed (Eccellere Product Standard, sections 2 and 9). A new admin screen is added here in the same change.
 */
export interface AdminItem { label: string; href: string }
/** `stages`: the group's items are shown as the numbered "Stage" strip under the top bar. */
export interface AdminGroup { id: string; label: string; items: AdminItem[]; stages?: boolean }

export const ADMIN_GROUPS: AdminGroup[] = [
  { id: "overview", label: "Overview", items: [{ label: "Dashboard", href: "/admin" }] },
  {
    id: "tools", label: "Tools marketplace", stages: true,
    items: [
      { label: "Build", href: "/admin/forms" },
      { label: "Classify and deepen", href: "/admin/forms/classify" },
      { label: "Review and publish", href: "/admin/tools" },
    ],
  },
  { id: "agents", label: "Agent Marketplace", items: [{ label: "Agent control", href: "/admin/agents" }] },
  { id: "people", label: "People", items: [{ label: "Clients", href: "/admin/clients" }, { label: "Specialists", href: "/admin/specialists" }, { label: "Users", href: "/admin/users" }] },
  { id: "commerce", label: "Commerce", items: [{ label: "Assets", href: "/admin/assets" }, { label: "Orders", href: "/admin/orders" }, { label: "Finance", href: "/admin/finance" }, { label: "Coupons", href: "/admin/coupons" }, { label: "Pricing", href: "/admin/pricing" }] },
  { id: "engage", label: "Content and enquiries", items: [{ label: "Content", href: "/admin/content" }, { label: "Chatbot", href: "/admin/chatbot" }, { label: "Contact enquiries", href: "/admin/contact-enquiries" }, { label: "AI advisor", href: "/admin/advisor" }] },
  { id: "platform", label: "Platform", items: [{ label: "AI providers", href: "/admin/ai-settings" }, { label: "Audit log", href: "/admin/audit-log" }] },
];

export type AdminEntry = AdminItem & { group: AdminGroup };
export const ADMIN_ITEMS: AdminEntry[] = ADMIN_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g })));

/** The menu entry a path belongs to: the longest address that matches (so /admin/forms/classify is not "Build"). */
export function activeItem(pathname: string): AdminEntry | null {
  return [...ADMIN_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => (i.href === "/admin" ? pathname === "/admin" : pathname === i.href || pathname.startsWith(`${i.href}/`))) ?? null;
}
