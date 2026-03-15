"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, HelpCircle, ChevronDown } from "lucide-react";

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

const faqs = [
  {
    id: 1,
    question: "How does SynthInterview's AI work?",
    answer:
      "SynthInterview uses an autonomous evaluation engine that processes voice and code streams in real-time. It adapts its questioning strategy based on cumulative candidate performance.",
  },
  {
    id: 2,
    question: "What programming languages are supported?",
    answer:
      "We provide full sandboxed runtimes for Python, JavaScript, TypeScript, Java, C++, and Go. Each environment includes standard libraries and real-time execution.",
  },
  {
    id: 3,
    question: "How do you prevent cheating or fraud?",
    answer:
      "Our integrity suite employs multi-factor signals: biometric matching, tab-activity tracking, and clipboard monitoring to ensure session authenticity.",
  },
  {
    id: 4,
    question: "Can I customize the interview curriculum?",
    answer:
      "Absolutely. You can define focus areas ranging from core algorithms to systems design. The AI generates a unique interview vector for every candidate.",
  },
  {
    id: 5,
    question: "What happens after the interview ends?",
    answer:
      "A comprehensive architectural report is generated instantly. This includes code playback, sentiment analysis, and integrity audit logs.",
  },
];

export default function FAQSection() {
  const [openId, setOpenId] = React.useState<number | null>(null);

  return (
    <section
      id="faq"
      className="section-container bg-[#030303] border-t border-white/5 py-32 md:py-48 overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/[0.01] rounded-full blur-[120px] pointer-events-none" />

      <div className="section-inner relative z-10 px-6 sm:px-10 max-w-4xl w-full">
        <motion.header
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mb-24 text-center flex flex-col items-center"
        >
          <motion.div
            variants={fadeUpVariants}
            className="section-badge mb-6 gap-2.5"
          >
            <HelpCircle size={14} className="text-white/40 flex-shrink-0" />
            <span className="leading-none translate-y-[0.5px]">
              Knowledge Base
            </span>
          </motion.div>
          <motion.h2
            variants={fadeUpVariants}
            className="section-title text-gradient !text-4xl md:!text-7xl leading-[1.1]"
          >
            Curiosity <span className="font-serif-italic">architected</span>.
          </motion.h2>
          <motion.p
            variants={fadeUpVariants}
            className="mt-8 text-white/70 max-w-xl text-lg md:text-xl leading-relaxed mx-auto"
          >
            Deep technical answers for the engineering-first hiring process.
          </motion.p>
        </motion.header>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="flex flex-col gap-6"
        >
          {faqs.map((faq) => (
            <motion.div
              key={faq.id}
              variants={fadeUpVariants}
              className={`group transition-all duration-700 ${
                openId === faq.id
                  ? "rounded-[2.5rem] bg-white/[0.04] border border-white/20 shadow-2xl"
                  : "rounded-[4rem] bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.03]"
              }`}
            >
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-8 md:p-10 text-left outline-none cursor-pointer"
              >
                <h3
                  className={`text-xl md:text-2xl font-bold tracking-tight transition-all duration-500 ${openId === faq.id ? "text-white" : "text-white/70 group-hover:text-white"}`}
                >
                  {faq.question}
                </h3>
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-500 ${openId === faq.id ? "bg-white text-black border-white shadow-xl rotate-180" : "bg-white/5 border-white/10 group-hover:border-white/30"}`}
                >
                  <ChevronDown
                    size={22}
                    className={`transition-transform duration-500 ${openId === faq.id ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {openId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="px-8 md:px-10 pb-10">
                      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />
                      <p className="text-white/70 leading-relaxed text-lg md:text-xl font-medium max-w-3xl">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
