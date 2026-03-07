"use client";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function AuthorityPage() {
  useEffect(() => {
    redirect("/authority/dashboard");
  }, []);

  return null;
}
