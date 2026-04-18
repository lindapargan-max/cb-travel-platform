import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, ChevronDown, User, LogOut, LayoutDashboard, Shield, Plane } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464925361/dPHKGynvhLRtUrGZhYEBQ4/CBTravel_BlackTransparent_35c2ad4d.png";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = location === "/";
  const navBg = scrolled || !isHome
    ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-border"
    : "bg-transparent";
  const textColor = scrolled || !isHome ? "text-foreground" : "text-white";
  const logoFilter = scrolled || !isHome ? "" : "brightness-0 invert";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: null, label: "Weekly Deals", anchor: "deals" },
    { href: "/community", label: "Community" },
    { href: "/quote-request", label: "Request a Quote" },
    { href: "/faq", label: "FAQ" },
    { href: "/flight-manager", label: "Flight Tracker" },
  ];

  const handleWeeklyDeals = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location !== "/") {
      window.location.href = "/#deals";
    } else {
      const el = document.getElementById("deals");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/">
            <img
              src={LOGO_URL}
              alt="CB Travel"
              className={`h-12 w-auto cursor-pointer transition-all duration-300 ${logoFilter}`}
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.anchor ? (
                <a
                  key={link.label}
                  href={`/#${link.anchor}`}
                  onClick={handleWeeklyDeals}
                  className={`text-sm font-medium transition-colors duration-200 cursor-pointer link-underline ${textColor} hover:opacity-80`}
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href!}>
                  <span className={`text-sm font-medium transition-colors duration-200 cursor-pointer link-underline ${textColor} hover:opacity-80`}>
                    {link.label}
                  </span>
                </Link>
              )
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            <a href="tel:07495823953" className={`flex items-center gap-1.5 text-sm font-medium ${textColor} opacity-80 hover:opacity-100 transition-opacity`}>
              <Phone size={14} />
              <span>07495 823953</span>
            </a>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-2 rounded-full px-4 ${scrolled || !isHome ? "border-primary text-primary hover:bg-primary hover:text-white" : "border-white text-white hover:bg-white/10"}`}
                  >
                    <User size={15} />
                    <span className="max-w-[120px] truncate">{user.name || user.email}</span>
                    <ChevronDown size={13} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl border-border">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <span className="flex items-center gap-2 cursor-pointer w-full">
                        <LayoutDashboard size={15} />
                        My Account
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/loyalty">
                      <span className="flex items-center gap-2 cursor-pointer w-full">
                        <span>🏆</span>
                        My Loyalty Points
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <span className="flex items-center gap-2 cursor-pointer w-full">
                          <Shield size={15} />
                          Admin Dashboard
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut size={15} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-full px-4 ${scrolled || !isHome ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"}`}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="rounded-full px-5 btn-gold border-0 text-foreground"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${textColor}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-border shadow-xl">
          <div className="container py-4 space-y-1">
            {navLinks.map((link) => (
              link.anchor ? (
                <a
                  key={link.label}
                  href={`/#${link.anchor}`}
                  onClick={handleWeeklyDeals}
                  className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href!}>
                  <span
                    className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </span>
                </Link>
              )
            ))}
            <div className="pt-3 border-t border-border space-y-2">
              <a href="tel:07495823953" className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                <Phone size={14} />
                07495 823953
              </a>
              {user ? (
                <>
                  <Link href="/dashboard">
                    <span className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg cursor-pointer" onClick={() => setIsOpen(false)}>
                      <LayoutDashboard size={15} />
                      My Account
                    </span>
                  </Link>
                  {user.role === "admin" && (
                    <Link href="/admin">
                      <span className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg cursor-pointer" onClick={() => setIsOpen(false)}>
                        <Shield size={15} />
                        Admin Dashboard
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={() => { logoutMutation.mutate(); setIsOpen(false); }}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 rounded-lg w-full text-left"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-4">
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="rounded-full flex-1" onClick={() => setIsOpen(false)}>
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="rounded-full flex-1 btn-gold border-0" onClick={() => setIsOpen(false)}>
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
