"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as data from "@/data";
import { buildTree, complete, pathText, run, type Line, type Part } from "@/lib/terminal-shell";
import { NAME_BANNER, SQUIRTLE } from "@/data/terminal-art";
import "./terminal.css";

export const HOST = "kevanwee";
export const USER = "guest";
type Item = { kind: "out"; line: Line } | { kind: "cmd"; cwd: string[]; text: string } | { kind: "welcome" };
type Entry = Item & { id: number };

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;


function Parts({ line, onRun }: { line: Line; onRun: (cmd: string) => void }) {
  if (!line.some(p => p.text)) return <div>&nbsp;</div>;
  return <div>{line.map((p: Part, i) => {
    const cls = p.tone ? `term-${p.tone}` : undefined;
    if (p.href) return <a key={i} className={cls} href={p.href} target="_blank" rel="noopener noreferrer">{p.text}</a>;
    if (p.run) return <button key={i} type="button" className={`${cls ?? ""} term-run`} onClick={() => onRun(p.run!)}>{p.text}</button>;
    return <span key={i} className={cls}>{p.text}</span>;
  })}</div>;
}

function Prompt({ cwd }: { cwd: string[] }) {
  return <><span className="term-user">{USER}@{HOST}</span><span className="term-muted">:</span><span className="term-dir">{pathText(cwd)}</span><span className="term-muted">$ </span></>;
}

/** The welcome: the name banner, then Squirtle (from Pokémon Blue's title screen) beside who this is and the
 *  sections to start from. Both pieces of art come from scripts/build-terminal-art.py. */
function Welcome({ onRun }: { onRun: (cmd: string) => void }) {
  const p = data.personal;
  const field = (k: string, v: ReactNode) => <div><span className="term-accent">{k.padEnd(9)}</span>{v}</div>;
  const sections = buildTree(data).children.map(c => c.name);
  return <div className="term-welcome">
    <pre className="term-banner" role="img" aria-label={p.name}>{NAME_BANNER}</pre>
    <div className="term-welcome-row">
    <pre className="term-art" role="img" aria-label="Squirtle in text art">{SQUIRTLE}</pre>
    <div className="term-card">
      <div><span className="term-user">{USER}@{HOST}</span></div>
      <div className="term-muted">{"-".repeat(USER.length + HOST.length + 1)}</div>
      {field("Name", p.fullName)}
      {field("Study", `${p.title} · ${p.institution}`)}
      {field("Focus", p.tagline)}
      {field("Folders", <>{sections.map((s, i) => <span key={s}>{i ? " " : ""}<button type="button" className="term-dir term-run" onClick={() => onRun(`cd ~/${s}`)}>{s}/</button></span>)}</>)}
      {field("Links", <><a className="term-link" href={p.github} target="_blank" rel="noopener noreferrer">GitHub</a>{" "}
        <a className="term-link" href={p.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>{" "}
        <a className="term-link" href={`mailto:${p.email}`}>Email</a></>)}
      <div>&nbsp;</div>
      <div className="term-muted">Type <button type="button" className="term-accent term-run" onClick={() => onRun("help")}>help</button>, or click any folder or file.</div>
    </div>
    </div>
  </div>;
}

/** A pretend SSH session over the portfolio: cd through its sections, ls/dir them, cat the files. The shell
 *  around it (a page, or a floating window) supplies the title bar; `exit` calls onExit. */
export function TerminalSession({ onExit, onCwd, active = true }: { onExit: () => void; onCwd?: (cwd: string[]) => void; active?: boolean }) {
  const root = useMemo(() => buildTree(data), []);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [cwd, setCwd] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const history = useRef<string[]>([]), cursor = useRef(-1), nextId = useRef(0);
  const field = useRef<HTMLInputElement>(null), screen = useRef<HTMLDivElement>(null);
  const cwdRef = useRef(cwd); cwdRef.current = cwd;
  const onExitRef = useRef(onExit); onExitRef.current = onExit;
  useEffect(() => { onCwd?.(cwd); }, [cwd, onCwd]);

  const push = useCallback((...items: Item[]) =>
    setEntries(e => [...e, ...items.map(i => ({ ...i, id: nextId.current++ }))]), []);

  const execute = useCallback((text: string) => {
    const at = cwdRef.current;
    const result = run(root, at, text, history.current, USER);
    if (text.trim()) { history.current = [...history.current, text.trim()]; }
    cursor.current = -1;
    if (result.clear) { setEntries([]); setCwd(result.cwd); return; }
    push({ kind: "cmd", cwd: at, text }, ...result.lines.map(line => ({ kind: "out" as const, line })));
    if (/^\s*neofetch\s*$/i.test(text)) push({ kind: "welcome" });
    setCwd(result.cwd);
    if (result.open) window.open(result.open, "_blank", "noopener,noreferrer");
    if (result.exit) setTimeout(() => onExitRef.current(), reduced() ? 0 : 400);
  }, [push, root]);

  // The connection, then the welcome card and a first listing
  useEffect(() => {
    const steps: (() => void)[] = [
      () => push({ kind: "out", line: [{ text: "$ ", tone: "muted" }, { text: `ssh ${USER}@${HOST}.vercel.app` }] }),
      () => push({ kind: "out", line: [{ text: `Connecting to ${HOST}.vercel.app…`, tone: "muted" }] }),
      () => push({ kind: "out", line: [{ text: `Signed in as ${USER}. No password needed; everything here is public.`, tone: "muted" }] }, { kind: "out", line: [] }),
      () => { push({ kind: "welcome" }); },
      () => { execute("ls"); setReady(true); },
    ];
    if (reduced()) { steps.forEach(s => s()); return; }
    const timers = steps.map((s, i) => setTimeout(s, i * 280));
    return () => timers.forEach(clearTimeout);
  }, [execute, push]);

  // Follow the output once the visitor has run something; until then the welcome stays in view from the top
  const following = useRef(false);
  useEffect(() => { if (following.current) screen.current?.scrollTo({ top: screen.current.scrollHeight }); }, [entries]);
  useEffect(() => { if (ready && active) field.current?.focus({ preventScroll: true }); }, [ready, active]);

  const clickRun = useCallback((cmd: string) => { following.current = true; execute(cmd); field.current?.focus({ preventScroll: true }); }, [execute]);

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); following.current = true; execute(input); setInput(""); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      const done = complete(root, cwd, input);
      setInput(done.input);
      if (done.options.length > 1) push({ kind: "cmd", cwd, text: input }, { kind: "out", line: done.options.flatMap((o, i) => [...(i ? [{ text: "  " }] : []), { text: o, tone: o.endsWith("/") ? "dir" as const : "file" as const }]) });
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current; if (!h.length) return;
      cursor.current = e.key === "ArrowUp" ? (cursor.current < 0 ? h.length - 1 : Math.max(0, cursor.current - 1)) : cursor.current < 0 ? -1 : cursor.current + 1;
      if (cursor.current >= h.length) cursor.current = -1;
      setInput(cursor.current < 0 ? "" : h[cursor.current]);
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "l") { e.preventDefault(); setEntries([]); return; }
    if (e.ctrlKey && e.key.toLowerCase() === "c" && !window.getSelection()?.toString()) { e.preventDefault(); push({ kind: "cmd", cwd, text: input + "^C" }); setInput(""); }
  }

  return <div ref={screen} className="term-screen" data-lenis-prevent
    onClick={() => { if (!window.getSelection()?.toString()) field.current?.focus({ preventScroll: true }); }}>
    <div role="log" aria-live="polite" aria-label="Terminal output">
      {entries.map(e => e.kind === "welcome" ? <Welcome key={e.id} onRun={clickRun} />
        : e.kind === "cmd" ? <div key={e.id}><Prompt cwd={e.cwd} /><span>{e.text}</span></div>
        : <Parts key={e.id} line={e.line} onRun={clickRun} />)}
    </div>
    {ready && <label className="term-input">
      <Prompt cwd={cwd} />
      <input ref={field} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
        aria-label="Terminal command" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="go" />
    </label>}
  </div>;
}

/** The title bar text: who is connected where. */
export const titleFor = (cwd: string[]) => `${USER}@${HOST}: ${pathText(cwd)} — ssh`;

/** /terminal: the session as a full page, for direct links. */
export default function TerminalPage() {
  const [cwd, setCwd] = useState<string[]>([]);
  const router = useRouter();
  return <div className="term-page">
    <Link href="/" className="term-back">← Portfolio</Link>
    <section className="term-window term-window-page" aria-label="Terminal portfolio">
      <div className="term-bar">
        <span className="term-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="term-title">{titleFor(cwd)}</span>
      </div>
      <TerminalSession onExit={() => router.push("/")} onCwd={setCwd} />
    </section>
  </div>;
}
