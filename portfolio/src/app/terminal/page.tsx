import type { Metadata } from "next";
import Terminal from "@/components/Terminal";
import "./terminal.css";

export const metadata: Metadata = {
  title: "Kevan Wee — Terminal",
  description: "Kevan Wee's portfolio as a terminal session: cd through the sections, ls them, cat the files.",
  alternates: { canonical: "/terminal" },
};

export default function TerminalPage() {
  return <Terminal />;
}
