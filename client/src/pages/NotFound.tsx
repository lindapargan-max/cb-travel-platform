import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Plane } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 pt-20">
      <div className="text-center px-6 max-w-md">
        <div className="w-24 h-24 bg-primary/8 rounded-full flex items-center justify-center mx-auto mb-8">
          <Plane size={40} className="text-primary" />
        </div>
        <h1 className="font-serif text-7xl font-bold text-primary mb-4">404</h1>
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">Page Not Found</h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Looks like this page has taken off without us. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="rounded-full btn-gold border-0 text-foreground gap-2 px-8">
              <Home size={15} />
              Back to Home
            </Button>
          </Link>
          <Link href="/quote-request">
            <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white gap-2 px-8">
              Request a Quote
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
