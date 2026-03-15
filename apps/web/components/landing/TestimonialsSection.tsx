"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    title: "VP of Engineering",
    company: "TechFlow Inc.",
    content:
      "SynthInterview has transformed our hiring process. We've reduced interview time by 60% while improving the quality of our technical assessments.",
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    title: "Director of Talent",
    company: "Innovate Solutions",
    content:
      "The fraud detection features gave us confidence we were missing with traditional take-home assignments. Now we can trust the results.",
  },
  {
    id: 3,
    name: "Jessica Lin",
    title: "Senior Eng Manager",
    company: "DataDriven Corp",
    content:
      "The detailed scorecards help us make data-driven decisions. Being able to see communication depth alongside code is a game changer.",
  },
  {
    id: 4,
    name: "David Kim",
    title: "CTO",
    company: "StartupXYZ",
    content:
      "As a small team, we don't have bandwidth for lengthy processes. Synth lets us screen candidates efficiently without sacrificing thoroughness.",
  },
];

export default function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="section-container bg-[#030303] border-t border-white/5 py-32 md:py-48 overflow-hidden"
    >
      <div className="section-inner relative z-10 px-6 sm:px-10 max-w-7xl">
        <motion.header
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mb-32 text-center flex flex-col items-center"
        >
          <div className="section-badge mb-8 gap-2.5">
            <Quote size={14} className="text-white/40 flex-shrink-0" />
            <span className="leading-none translate-y-[0.5px]">
              Ecosystem Signals
            </span>
          </div>
          <h2 className="section-title text-gradient !text-4xl md:!text-7xl leading-[1.1]">
            Loved by <br />{" "}
            <span className="font-serif-italic">engineering</span> teams.
          </h2>
        </motion.header>

        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariants}
              className="p-10 lg:p-14 rounded-[2.5rem] border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.025] transition-all duration-700 group flex flex-col justify-between shadow-xl"
            >
              <div className="space-y-8">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={12}
                      fill="white"
                      stroke="none"
                      className="opacity-10 group-hover:opacity-40 transition-opacity"
                    />
                  ))}
                </div>
                <p className="text-white/70 text-xl md:text-2xl leading-relaxed italic font-medium group-hover:text-white transition-colors duration-500">
                  "{testimonial.content}"
                </p>
              </div>

              <div className="flex items-center gap-6 border-t border-white/5 pt-10 mt-12">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg font-black text-white/30 group-hover:scale-110 group-hover:border-white/30 group-hover:bg-white/[0.08] group-hover:text-white transition-all duration-500 shadow-lg">
                  {testimonial.name.split(" ")[0][0]}
                  {testimonial.name.split(" ")[1]?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">
                    {testimonial.name}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
                    <span className="group-hover:text-white/50 transition-colors">
                      {testimonial.title}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-white/50 group-hover:text-white/80 transition-colors">
                      {testimonial.company}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
