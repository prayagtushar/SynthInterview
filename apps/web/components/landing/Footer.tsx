"use client";

import React from "react";
import Link from "next/link";
import { Github, Twitter, Linkedin, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="section-container bg-[#030303] border-t border-white/5 pt-32 pb-16">
      <div className="section-inner px-6 sm:px-10">
        <div className="flex flex-col md:grid md:grid-cols-12 gap-16 mb-24">
          <div className="md:col-span-4 space-y-8">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="w-12 h-12 flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 overflow-hidden rounded-xl border border-white/10">
                <img
                  src="/logo.svg"
                  alt="SynthInterview Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-black text-2xl text-white italic tracking-tighter">
                SYNTH
              </span>
            </Link>
            <p className="text-white/70 leading-relaxed text-lg max-w-sm">
              The next generation of technical hiring. Automated, objective, and
              scalable technical assessments powered by advanced real-time AI.
            </p>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h4 className="text-white font-black text-[11px] uppercase tracking-[0.4em]">
              Product
            </h4>
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-white/70 hover:text-white transition-colors text-sm font-bold"
              >
                Features
              </a>
              <a
                href="#workflow"
                className="text-white/70 hover:text-white transition-colors text-sm font-bold"
              >
                Workflow
              </a>
              <a
                href="#use-cases"
                className="text-white/70 hover:text-white transition-colors text-sm font-bold"
              >
                Solutions
              </a>
              <a
                href="#faq"
                className="text-white/70 hover:text-white transition-colors text-sm font-bold"
              >
                FAQ
              </a>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h4 className="text-white font-black text-[11px] uppercase tracking-[0.4em]">
              Connect
            </h4>
            <div className="flex flex-col gap-4">
              <a
                href="#"
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold group"
              >
                Twitter{" "}
                <ArrowUpRight
                  size={12}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold group"
              >
                LinkedIn{" "}
                <ArrowUpRight
                  size={12}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold group"
              >
                GitHub{" "}
                <ArrowUpRight
                  size={12}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </a>
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] space-y-6">
              <h4 className="text-white font-black text-[11px] uppercase tracking-[0.4em]">
                Get Updates
              </h4>
              <div className="flex bg-white/5 border border-white/10 rounded-full p-2 focus-within:border-white/30 transition-colors">
                <input
                  type="email"
                  placeholder="email@company.com"
                  className="bg-transparent border-none outline-none px-4 py-2 text-white text-sm flex-1 placeholder:text-white/20"
                />
                <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-[#fff] transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.4em]">
            &copy; 2026 SynthInterview. All rights reserved. &bull;{" "}
            <span className="text-white/40">Version 2.5.0</span>
          </p>
          <div className="flex gap-12">
            <a
              href="#"
              className="text-white/30 hover:text-white text-[9px] font-bold uppercase tracking-[0.4em] transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-white/30 hover:text-white text-[9px] font-bold uppercase tracking-[0.4em] transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
