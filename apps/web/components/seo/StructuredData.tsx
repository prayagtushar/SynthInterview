"use client";

import React from "react";

export default function StructuredData() {
  return (
    <>
      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "SynthInterview",
          url: "https://synthinterview.com",
          logo: "/logo.svg",
          description:
            "Objective AI-powered technical interview platform that eliminates bias in hiring",
          sameAs: [
            "https://linkedin.com/company/synthinterview",
            "https://twitter.com/synthinterview",
          ],
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+1-800-SYNTH-INTV",
            contactType: "Customer Service",
            areaServed: "US",
          },
        })}
      </script>

      {/* WebPage Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "SynthInterview — Objective AI Technical Interviews",
          description:
            "Eliminate bias in technical hiring with SynthInterview's AI-powered coding interviews. Get objective assessments, live code analysis, and fraud detection at scale.",
          url: "https://synthinterview.com",
          isPartOf: {
            "@type": "WebSite",
            name: "SynthInterview",
            url: "https://synthinterview.com",
          },
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: "/og-image.svg",
          },
        })}
      </script>

      {/* FAQ Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How does SynthInterview's AI work?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "SynthInterview uses Gemini 2.5 Flash Live to conduct voice-based technical interviews. The AI adapts questions in real-time based on candidate responses, analyzes code quality, communication skills, and problem-solving approach, while monitoring for integrity signals.",
              },
            },
            {
              "@type": "Question",
              name: "What programming languages are supported?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "We support JavaScript, Python, Java, C++, and Go through our Monaco editor with live execution capabilities. Candidates can run their code against test cases and get immediate feedback.",
              },
            },
            {
              "@type": "Question",
              name: "How do you prevent cheating or fraud?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Our integrity suite includes tab-switch blocking, paste detection, mouse-exit tracking, right-click blocking, and webcam face monitoring. Any anomalies are flagged in the audit log with a fraud badge on the recruiter dashboard.",
              },
            },
          ],
        })}
      </script>

      {/* Breadcrumb Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://synthinterview.com/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Features",
              item: "https://synthinterview.com/#features",
            },
          ],
        })}
      </script>
    </>
  );
}
