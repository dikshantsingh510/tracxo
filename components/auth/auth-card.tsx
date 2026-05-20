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
    <Card className="surface-acrylic-heavy border-slate-200/60 shadow-xl dark:border-slate-800/60">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="font-semibold text-2xl tracking-tight">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      {footer ? (
        <div className="border-slate-200/50 border-t px-6 py-4 text-center text-slate-600 text-sm dark:border-slate-800/50 dark:text-slate-400">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
