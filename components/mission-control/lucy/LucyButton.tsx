"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils/cn";

interface LucyButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

function AvatarFallback() {
  return (
    <div className="w-full h-full rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-2xl select-none">
      🤖
    </div>
  );
}

export function LucyButton({ onClick, isOpen }: LucyButtonProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Reserved slot for future unread badge */}
      <div className="relative">
        <button
          onClick={onClick}
          className={cn(
            "w-14 h-14 rounded-full overflow-hidden",
            "flex items-center justify-center",
            "transition-all duration-200 ease-out",
            "hover:scale-105",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900",
            "shadow-lg shadow-black/40",
            isOpen
              ? "bg-surface-700 border border-surface-600 hover:ring-2 hover:ring-green-500/40"
              : "hover:ring-2 hover:ring-green-500/40"
          )}
          aria-label={isOpen ? "Cerrar mcLucy" : "Abrir mcLucy"}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <div className="w-full h-full flex items-center justify-center bg-surface-700">
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-white" />
            </div>
          ) : imgError ? (
            <AvatarFallback />
          ) : (
            <img
              src="/office/mcmonkes-library/001.png"
              alt="mcLucy"
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </button>

        {/* Unread badge slot — hidden for now, reserved for notifications */}
        {/* To enable: replace `false` with your unread count condition */}
        {false && (
          <span
            className={cn(
              "absolute top-0 right-0 w-3 h-3 rounded-full",
              "bg-green-400 border-2 border-surface-900",
              "shadow-[0_0_8px_rgba(74,222,128,0.8)]"
            )}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
