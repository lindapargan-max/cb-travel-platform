import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    // We use a small timeout to ensure the DOM has updated
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }, 0);
    
    return () => clearTimeout(timer);
  }, [location]);

  return null;
}
