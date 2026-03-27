"use client";

import { useState } from "react";
import { LucyButton } from "./LucyButton";
import { LucySidebar } from "./LucySidebar";

export function LucyProvider() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <LucyButton onClick={() => setIsOpen((v) => !v)} isOpen={isOpen} />
      <LucySidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
