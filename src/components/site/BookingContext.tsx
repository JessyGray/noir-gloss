"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ServiceId } from "@/lib/config";

interface Ctx {
  open: boolean;
  preset: ServiceId | null;
  openBooking: (service?: ServiceId) => void;
  closeBooking: () => void;
}

const BookingCtx = createContext<Ctx | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<ServiceId | null>(null);
  const openBooking = useCallback((service?: ServiceId) => {
    setPreset(service ?? null);
    setOpen(true);
  }, []);
  const closeBooking = useCallback(() => setOpen(false), []);
  return <BookingCtx.Provider value={{ open, preset, openBooking, closeBooking }}>{children}</BookingCtx.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingCtx);
  if (!ctx) throw new Error("useBooking outside BookingProvider");
  return ctx;
}

export function BookButton({
  children,
  className = "btn btn-primary",
  service,
}: {
  children: React.ReactNode;
  className?: string;
  service?: ServiceId;
}) {
  const { openBooking } = useBooking();
  return (
    <button type="button" className={className} onClick={() => openBooking(service)} aria-haspopup="dialog">
      {children}
    </button>
  );
}
