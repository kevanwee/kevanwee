"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import * as data from "@/data";
import { buildTree, complete, pathText, run, type Line, type Part } from "@/lib/terminal-shell";
import { MEGA_DIANCIE } from "@/data/terminal-art";

const HOST = "kevanwee";
const USER = "guest";
type Item = { kind: "out"; line: Line } | { kind: "cmd"; cwd: string[]; text: string } | { kind: "welcome" };
type Entry = Item & { id: number };

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Mega Diancie in line-only ASCII (scripts/build-terminal-art.py, from her PMD idle sprite). */
function DiancieArt() {
  return <pre className="term-art" role="img" aria-label="Mega Diancie in ASCII art">{MEGA_DIANCIE}</pre>;
}

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

/** The welcome card: the art beside who this is, with the sections to start from. */
function Welcome({ onRun }: { onRun: (cmd: string) => void }) {
  const p = data.personal;
  const field = (k: string, v: ReactNode) => <div><span className="term-accent">{k.padEnd(9)}</span>{v}</div>;
  const sections = buildTree(data).children.map(c => c.name);
  return <div className="term-welcome">
    <DiancieArt />
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
  </div>;
}

/** A pretend SSH session over the portfolio: cd through its sections, ls/dir them, cat the files. */
export default function Terminal() {
  const root = useMemo(() => buildTree(data), []);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [cwd, setCwd] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const history = useRef<string[]>([]), cursor = useRef(-1), nextId = useRef(0);
  const field = useRef<HTMLInputElement>(null), screen = useRef<HTMLDivElement>(null);
  const cwdRef = useRef(cwd); cwdRef.current = cwd;

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
    if (result.exit) setTimeout(() => { window.location.href = "/"; }, reduced() ? 0 : 500);
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

  useEffect(() => { screen.current?.scrollTo({ top: screen.current.scrollHeight }); }, [entries]);
  useEffect(() => { if (ready) field.current?.focus({ preventScroll: true }); }, [ready]);

  const clickRun = useCallback((cmd: string) => { execute(cmd); field.current?.focus({ preventScroll: true }); }, [execute]);

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); execute(input); setInput(""); return; }
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

  return <div className="term-page">
    <Link href="/" className="term-back">← Portfolio</Link>
    <section className="term-window" aria-label="Terminal portfolio">
      <div className="term-bar" aria-hidden="true">
        <span className="term-dots"><i /><i /><i /></span>
        <span>{USER}@{HOST}: {pathText(cwd)} — ssh</span>
      </div>
      <div ref={screen} className="term-screen" data-lenis-prevent
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
      </div>
    </section>
  </div>;
}
