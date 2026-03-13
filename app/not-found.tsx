import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950">
      <div className="text-center space-y-3">
        <FontAwesomeIcon icon={faCircleXmark} className="text-4xl text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-200">404 — Not Found</h2>
        <Link href="/app" className="text-sm text-cyan-400 hover:underline">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
