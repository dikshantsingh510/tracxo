import { FloatingNav } from "@/components/marketing/floating-nav";
import { Footer } from "@/components/marketing/footer";

// Public marketing chrome. FloatingNav handles its own surface + z-index;
// the layout itself stays bare so each route owns its own atmosphere.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <FloatingNav />
      <main className="relative flex-1">{children}</main>
      <Footer />
    </div>
  );
}
