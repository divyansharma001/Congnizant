import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scroll window to top on route or query-string change (catalog pagination, filters, PDP slug). */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}
