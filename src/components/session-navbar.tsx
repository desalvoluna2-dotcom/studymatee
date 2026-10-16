"use client";

import { useEffect, useState } from "react";
import { Navbar } from "./nav";

export function SessionNavbar() {
  const [user, setUser] = useState<{
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  return <Navbar user={user} />;
}
