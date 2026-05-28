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
    <Card className="surface-acrylic-heavy gap-0 rounded-2xl border-border py-0 shadow-2xl">
      <CardHeader className="space-y-2 px-8 pt-8 pb-4 text-center lg:text-left">
        <CardTitle className="font-semibold text-2xl text-foreground tracking-tight">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-base">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 px-8 pb-8">{children}</CardContent>
      {footer ? (
        <div className="border-border border-t bg-muted/40 px-8 py-4 text-center text-muted-foreground text-sm lg:text-left">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
