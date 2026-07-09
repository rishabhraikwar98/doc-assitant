"use client";

import { useState } from "react";
import Link from "next/link";
import { Fraunces, JetBrains_Mono } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export default function MarketingPage() {
  const [activeWs, setActiveWs] = useState<"a" | "b">("a");

  return (
    <div className={`${fraunces.variable} ${mono.variable} min-h-screen bg-[#0B1120] text-[#ECEAE3]`}>
      {/* NAV */}
      <nav className="sticky top-0 z-20 border-b border-white/10 bg-[#0B1120]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <span className="font-mono text-[15px] tracking-tight">
            Doc<span className="text-[#E8A33D]">Assistant</span>
          </span>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="hidden text-[#8B93A7] hover:text-[#ECEAE3] sm:inline">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#E8A33D] px-4 py-2 font-medium text-[#1a1204] hover:bg-[#f0ad4e]"
            >
              Try it free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="border-b border-white/10 px-6 pb-16 pt-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 font-mono text-xs uppercase tracking-widest text-[#49C9B8]">
            AI document assistant · private by design
          </div>
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="mb-5 max-w-[18ch] text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl"
          >
            Ask your documents.
            <br />
            Only the ones in <em className="not-italic text-[#E8A33D]">this room.</em>
          </h1>
          <p className="mb-10 max-w-[56ch] text-lg text-[#8B93A7]">
            Upload your files into a workspace, and DocAssistant answers questions using
            only what&apos;s in that room — with sources, every time. Switch to a
            different workspace and ask the same thing: it won&apos;t know. Your
            data never crosses the walls.
          </p>
          <div className="mb-14 flex gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-[#E8A33D] px-5 py-2.5 text-sm font-medium text-[#1a1204] hover:bg-[#f0ad4e]"
            >
              Try it live →
            </Link>
            <a
              href="https://github.com/rishabhraikwar98/doc-assistant"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium hover:border-[#8B93A7]"
            >
              View source on GitHub
            </a>
          </div>

          {/* SIGNATURE DEMO */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121A2E]">
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveWs("a")}
                className={`flex flex-1 items-center gap-2 border-b-2 px-5 py-4 font-mono text-[13.5px] transition-colors ${
                  activeWs === "a"
                    ? "border-[#E8A33D] bg-[#E8A33D]/[0.14] text-[#ECEAE3]"
                    : "border-transparent text-[#8B93A7]"
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#E8A33D]" />
                Workspace A — Aurora
              </button>
              <button
                onClick={() => setActiveWs("b")}
                className={`flex flex-1 items-center gap-2 border-b-2 px-5 py-4 font-mono text-[13.5px] transition-colors ${
                  activeWs === "b"
                    ? "border-[#49C9B8] bg-[#49C9B8]/[0.14] text-[#ECEAE3]"
                    : "border-transparent text-[#8B93A7]"
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#49C9B8]" />
                Workspace B — Meridian
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 font-mono text-[13px] text-[#8B93A7]">
                <span className="text-[#ECEAE3]">Q —</span> &quot;What&apos;s the secret launch code for Project Aurora?&quot;
              </div>

              {activeWs === "a" ? (
                <div className="text-[15.5px]">
                  The secret launch code for Project Aurora is{" "}
                  <span className="rounded-md bg-[#E8A33D]/[0.14] px-2 py-0.5 font-mono text-sm text-[#E8A33D]">
                    FALCON-7731-FLAMINGO
                  </span>
                  , assigned during the pilot&apos;s kickoff meeting.
                  <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-md bg-[#E8A33D]/[0.14] px-2.5 py-1 font-mono text-xs text-[#E8A33D]">
                    [Source 1] project-aurora.txt
                  </div>
                </div>
              ) : (
                <div className="text-[15.5px]">
                  <span className="italic text-[#8B93A7]">
                    I don&apos;t know — this workspace&apos;s documents don&apos;t contain information relevant to that question.
                  </span>
                  <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-md bg-[#49C9B8]/[0.14] px-2.5 py-1 font-mono text-xs text-[#49C9B8]">
                    ✓ isolation held — Aurora&apos;s content stayed in Aurora&apos;s room
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-6 py-3.5 text-xs text-[#8B93A7]">
              Not a mockup — this is what actually happens across two real workspaces.
            </div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section className="border-b border-white/10 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3.5 font-mono text-xs uppercase tracking-widest text-[#49C9B8]">
            How it works
          </div>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mb-4 max-w-[20ch] text-2xl font-medium sm:text-3xl">
            From upload to answer, in a few seconds
          </h2>
          <p className="mb-10 max-w-[60ch] text-[15.5px] text-[#8B93A7]">
            Drop in your files. Ask a question in plain English. Get back an
            answer built only from what you uploaded — with a source you can
            click through to, every time.
          </p>

          <div className="flex flex-wrap overflow-hidden rounded-xl border border-white/10">
            {[
              { verb: "Upload", desc: "PDFs, Word docs, or plain text. Re-upload the same file and nothing gets duplicated." },
              { verb: "Understand", desc: "DocAssistant reads and organizes your documents behind the scenes — no setup required." },
              { verb: "Ask", desc: "Type a question the way you'd ask a colleague who'd actually read the file." },
              { verb: "Stay private", desc: "Only this workspace's documents are ever considered — nothing leaks in from another." },
              { verb: "Get an answer", desc: "Grounded in your files, with a source cited. If it's not in there, you'll be told plainly." },
            ].map((stage, i) => (
              <div key={i} className="min-w-37.5 flex-1 border-r border-white/10 bg-[#121A2E] p-4 last:border-r-0">
                <div className="mb-1.5 font-mono text-sm font-medium text-[#E8A33D]">{stage.verb}</div>
                <div className="text-[13px] leading-relaxed text-[#8B93A7]">{stage.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="border-b border-white/10 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3.5 font-mono text-xs uppercase tracking-widest text-[#49C9B8]">
            What it does
          </div>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mb-11 max-w-[20ch] text-2xl font-medium sm:text-3xl">
            Built so you can trust the answer
          </h2>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {[
              { title: "Answers you can check", desc: "Every answer points back to the document it came from. When your files don't cover a question, DocAssistance says so instead of making something up." },
              { title: "Private by default", desc: "Each workspace is its own room. What you upload to one never shows up in, or informs answers in, another — even though everything lives on the same platform." },
              { title: "Gets things done, not just answers", desc: "Ask DocAssistance to save a task or send an update, and it will — then keep a record of exactly what it did, so nothing happens quietly." },
              { title: "Doesn't fall over", desc: "Weird files, flaky connections, unexpected requests — handled gracefully, with a clear explanation instead of a silent failure or a crash." },
            ].map((cap, i) => (
              <div key={i} className="bg-[#121A2E] p-7">
                <h3 style={{ fontFamily: "var(--font-display)" }} className="mb-2.5 text-lg font-medium">
                  {cap.title}
                </h3>
                <p className="text-sm text-[#8B93A7]">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UNDER THE HOOD */}
      <section className="border-b border-white/10 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3.5 font-mono text-xs uppercase tracking-widest text-[#49C9B8]">
            Under the hood
          </div>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mb-4 max-w-[20ch] text-2xl font-medium sm:text-3xl">
            Privacy that isn&apos;t just a promise
          </h2>
          <p className="mb-6 max-w-[60ch] text-[15.5px] text-[#8B93A7]">
            The separation between workspaces isn&apos;t a setting you have to
            trust — it&apos;s enforced at the database level, every single
            time a question is asked. There&apos;s no code path that skips it.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {["Built on Next.js", "Powered by Google Gemini", "Secured with Supabase", "Deployed on Vercel"].map((chip) => (
              <span key={chip} className="rounded-md border border-white/10 px-3 py-1.5 font-mono text-xs text-[#8B93A7]">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3.5 font-mono text-xs uppercase tracking-widest text-[#49C9B8]">
            See it for yourself
          </div>
          <h2 style={{ fontFamily: "var(--font-display)" }} className="mb-4 max-w-[20ch] text-2xl font-medium sm:text-3xl">
            Try to break the privacy — we dare you
          </h2>
          <p className="mb-9 max-w-[60ch] text-[15.5px] text-[#8B93A7]">
            Don&apos;t just take our word for it. Here&apos;s a quick way to
            prove it to yourself in under a minute.
          </p>

          <div className="overflow-hidden rounded-xl border border-white/10 font-mono text-sm">
            {[
              "Create a workspace and upload a document with something only it would know.",
              "Ask about it — get a clear answer, with the source right there.",
              "Create a second, completely separate workspace.",
              "Ask the same question there. It won't know — and that's the point.",
            ].map((step, i) => (
              <div key={i} className="flex gap-4 border-b border-white/10 bg-[#121A2E] px-5 py-4 last:border-b-0">
                <span className="w-5 shrink-0 text-[#E8A33D]">{i + 1}</span>
                <span className="font-sans text-[14.5px] text-[#ECEAE3]">{step}</span>
              </div>
            ))}
          </div>

          <div className="mt-9 flex gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-[#E8A33D] px-5 py-2.5 text-sm font-medium text-[#1a1204] hover:bg-[#f0ad4e]"
            >
              Try it live →
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 py-11">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[15px]">
              Doc<span className="text-[#E8A33D]">Assistant</span>
            </div>
            <div className="mt-2 text-xs text-[#8B93A7]">
              A workspace-isolated document assistant. Built by Rishabh.
            </div>
          </div>
          <div className="flex gap-5 text-[13.5px] text-[#8B93A7]">
            <a href="https://github.com/rishabhraikwar98" target="_blank" rel="noopener noreferrer" className="hover:text-[#ECEAE3]">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
