export const ROLES = [
  {
    id:          "11111111-0000-0000-0000-000000000001",
    name:        "Marketing Specialist",
    slug:        "marketing",
    icon:        "📣",
    description: "Content, SEO, social media, email & digital campaigns",
  },
  {
    id:          "11111111-0000-0000-0000-000000000002",
    name:        "Sales Representative",
    slug:        "sales",
    icon:        "🤝",
    description: "Lead generation, outreach, closing & CRM management",
  },
  {
    id:          "11111111-0000-0000-0000-000000000003",
    name:        "Virtual Assistant",
    slug:        "virtual-assistant",
    icon:        "💻",
    description: "Admin support, scheduling, email & data entry",
  },
  {
    id:          "11111111-0000-0000-0000-000000000004",
    name:        "Executive Assistant",
    slug:        "executive-assistant",
    icon:        "🎯",
    description: "C-suite support, complex scheduling, travel & discretion",
  },
] as const;

export type RoleSlug = typeof ROLES[number]["slug"];
export type RoleId   = typeof ROLES[number]["id"];
