import { Badge } from "@/components/ui/badge";

// DESIGN.md §8.10 — workspace + platform roles get distinct visual identity.
// Owner uses the brand fill (only place outside primary buttons). Admin uses
// the emerald accent at lower weight. Member is neutral so it disappears
// (most rows are members; we don't want a green sea). Master uses warning
// to communicate "elevated, careful — internal only".

type Role = "owner" | "admin" | "member" | "master";

const COPY: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  master: "Master",
};

type Props = {
  role: Role;
  size?: "xs" | "sm" | "md";
  className?: string;
};

export function RoleBadge({ role, size = "sm", className }: Props) {
  if (role === "owner") {
    return (
      <Badge
        size={size}
        className={`bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-50 ${className ?? ""}`}
      >
        {COPY.owner}
      </Badge>
    );
  }
  if (role === "admin") {
    return (
      <Badge variant="success" size={size} className={className}>
        {COPY.admin}
      </Badge>
    );
  }
  if (role === "master") {
    return (
      <Badge variant="warning" size={size} className={className}>
        {COPY.master}
      </Badge>
    );
  }
  return (
    <Badge variant="neutral" size={size} className={className}>
      {COPY.member}
    </Badge>
  );
}
