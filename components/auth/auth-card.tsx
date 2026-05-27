import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="surface-acrylic-heavy border-border shadow-xl">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="font-semibold text-2xl text-foreground tracking-tight">
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      {footer ? (
        <div className="border-border border-t px-6 py-4 text-center text-muted-foreground text-sm">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
