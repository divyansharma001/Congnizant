import { Link } from "react-router-dom";

import { tw } from "@/shared/ui/tw";

export function NotFoundPage() {
  return (
    <div className={tw.stackMd}>
      <span className={tw.eyebrow}>Not found</span>
      <h1 className={tw.displayH1}>This demo route does not exist.</h1>
      <Link to="/" className={tw.button}>
        Back home
      </Link>
    </div>
  );
}
