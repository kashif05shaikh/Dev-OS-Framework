import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { AmbientBackground } from "@/components/dashboard/ambient";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  ChevronRight,
  Code2,
  HelpCircle,
  Layers,
  Lock,
  Sparkles,
  Wrench,
} from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  link?: {
    text: string;
    href: string;
  };
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "what-is-devos",
    category: "General & Architecture",
    question: "What is DevOS?",
    answer:
      "DevOS is an all-in-one developer workspace that manages learning, projects, goals, habits, jobs, notes, and coding profiles in one place.",
    link: {
      text: "Explore all 14 DevOS modules",
      href: "/features",
    },
  },
  {
    id: "who-is-devos-for",
    category: "General & Architecture",
    question: "Who is DevOS designed for?",
    answer:
      "DevOS is built for software engineers, computer science students, competitive programmers, and tech job seekers who need a focused, centralized system for their engineering workflow.",
  },
  {
    id: "is-devos-free",
    category: "General & Architecture",
    question: "Is DevOS free to use?",
    answer:
      "Yes. DevOS provides free core workspace features and client-side developer utilities with no subscription required.",
    link: {
      text: "Try free online developer utilities",
      href: "/tools",
    },
  },
  {
    id: "desktop-app-needed",
    category: "General & Architecture",
    question: "Does DevOS require installing desktop software?",
    answer:
      "No. DevOS is a fully responsive web application that runs directly in your browser across desktop, tablet, and mobile devices.",
  },
  {
    id: "coding-platforms-sync",
    category: "Coding Profiles & Practice",
    question: "Which competitive programming platforms does DevOS track?",
    answer:
      "DevOS syncs live statistics, problem counts, contest ratings, and badges from LeetCode, Codeforces, and CodeChef into a single profile dashboard.",
    link: {
      text: "See Coding Profiles Tracker feature",
      href: "/features/coding-profiles",
    },
  },
  {
    id: "learning-hub",
    category: "Coding Profiles & Practice",
    question: "What is the DevOS Learning Hub?",
    answer:
      "The Learning Hub organizes study roadmaps, DSA practice topics, language-specific notes, and technical bookmarks into a structured curriculum.",
    link: {
      text: "See Learning Hub feature",
      href: "/features/learning-hub",
    },
  },
  {
    id: "interview-prep",
    category: "Coding Profiles & Practice",
    question: "Can DevOS help me prepare for technical interviews?",
    answer:
      "Yes. You can track algorithmic topic coverage, record problem-solving notes with code syntax highlighting, and review your practice consistency.",
  },
  {
    id: "developer-notes",
    category: "Coding Profiles & Practice",
    question: "How does DevOS organize technical notes?",
    answer:
      "DevOS Notes provides a fast markdown editor with syntax highlighting, subject and folder categorization, and tag-based search for snippets.",
    link: {
      text: "See Developer Notes feature",
      href: "/features/notes",
    },
  },
  {
    id: "job-tracker",
    category: "Career, Projects & Goals",
    question: "How does the DevOS Job Tracker work?",
    answer:
      "The Job Tracker provides an engineering-specific pipeline to organize applications, technical interview rounds, compensation targets, and interview notes.",
    link: {
      text: "See Job Tracker feature",
      href: "/features/job-tracker",
    },
  },
  {
    id: "resume-builder",
    category: "Career, Projects & Goals",
    question: "Does DevOS include a technical resume builder?",
    answer:
      "Yes. DevOS features a markdown and structured technical resume builder optimized for software engineering roles and ATS readability.",
    link: {
      text: "See Resume Builder feature",
      href: "/features/resume-builder",
    },
  },
  {
    id: "project-management",
    category: "Career, Projects & Goals",
    question: "How does DevOS help manage coding projects?",
    answer:
      "The Projects module provides Kanban task boards, release roadmaps, tech stack tagging, and direct links to your GitHub repositories.",
    link: {
      text: "See Projects feature",
      href: "/features/projects",
    },
  },
  {
    id: "goals-and-habits",
    category: "Career, Projects & Goals",
    question: "Can I set goals and track developer habits in DevOS?",
    answer:
      "Yes. You can establish quarterly milestones in Goals, track daily coding streaks in Habits, and monitor your engineering momentum on the unified dashboard.",
    link: {
      text: "See Goals feature",
      href: "/features/goals",
    },
  },
  {
    id: "focus-timer",
    category: "Career, Projects & Goals",
    question: "What is the Focus Timer in DevOS?",
    answer:
      "The Focus Timer is a customizable Pomodoro timer designed for deep work with configurable coding session, short break, and long break intervals.",
    link: {
      text: "See Focus Timer feature",
      href: "/features/focus-timer",
    },
  },
  {
    id: "free-dev-tools",
    category: "Developer Utilities, Security & Comparisons",
    question: "What free online developer tools are included with DevOS?",
    answer:
      "DevOS provides free client-side developer utilities including a JSON Formatter & Validator, Regex Tester & Debugger, Base64 Encoder/Decoder, and UUID v4 Generator.",
    link: {
      text: "Explore all free developer tools",
      href: "/tools",
    },
  },
  {
    id: "tools-privacy",
    category: "Developer Utilities, Security & Comparisons",
    question: "Do the DevOS online developer tools send my data to a server?",
    answer:
      "No. All DevOS developer utilities execute 100% locally in your browser, ensuring sensitive tokens, payloads, and strings never leave your machine.",
    link: {
      text: "Try local JSON Formatter",
      href: "/tools/json-formatter",
    },
  },
  {
    id: "devos-vs-notion",
    category: "Developer Utilities, Security & Comparisons",
    question: "How is DevOS different from general-purpose note tools like Notion?",
    answer:
      "Unlike blank-canvas wikis like Notion, DevOS provides pre-built engineering systems like live LeetCode/Codeforces stats, tech job pipelines, and code-ready notes without manual template configuration.",
    link: {
      text: "Read full DevOS vs Notion comparison",
      href: "/compare/devos-vs-notion",
    },
  },
  {
    id: "devos-vs-trello",
    category: "Developer Utilities, Security & Comparisons",
    question: "How does DevOS compare to Trello for engineering projects?",
    answer:
      "While Trello offers generic Kanban cards, DevOS connects project tasks directly to live GitHub repos, tech stacks, developer roadmaps, and technical documentation.",
    link: {
      text: "Read full DevOS vs Trello comparison",
      href: "/compare/devos-vs-trello",
    },
  },
  {
    id: "data-security",
    category: "Developer Utilities, Security & Comparisons",
    question: "How is my personal workspace data secured in DevOS?",
    answer:
      "Your technical notes, roadmaps, and account data are saved to private authenticated database accounts protected with strict PostgreSQL row-level security.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => {
    const canonicalUrl = "https://www.dev-os.app/faq";

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.dev-os.app/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "FAQ",
          item: canonicalUrl,
        },
      ],
    };

    const faqPageSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: "DevOS Frequently Asked Questions",
      description:
        "Get fast, direct answers to common questions about DevOS features, live coding profile sync, developer utilities, security, and Notion alternatives.",
      publisher: {
        "@type": "Organization",
        name: "DevOS",
        url: "https://www.dev-os.app/",
      },
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    return {
      meta: [
        { title: "DevOS FAQ: All-in-One Developer Workspace Answers" },
        {
          name: "description",
          content:
            "Get fast, direct answers to common questions about DevOS features, live coding profile sync, developer utilities, security, and Notion alternatives.",
        },
        { property: "og:title", content: "DevOS FAQ: All-in-One Developer Workspace Answers" },
        {
          property: "og:description",
          content:
            "Get fast, direct answers to common questions about DevOS features, live coding profile sync, developer utilities, security, and Notion alternatives.",
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:site_name", content: "DevOS (dev-os.app)" },
        { property: "og:image", content: "https://www.dev-os.app/og-image.svg" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "DevOS FAQ: All-in-One Developer Workspace Answers" },
        {
          name: "twitter:description",
          content:
            "Get fast, direct answers to common questions about DevOS features, live coding profile sync, developer utilities, security, and Notion alternatives.",
        },
        { name: "twitter:image", content: "https://www.dev-os.app/og-image.svg" },
      ],
      links: [
        {
          rel: "canonical",
          href: canonicalUrl,
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbSchema),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(faqPageSchema),
        },
      ],
    };
  },
  component: FAQPage,
});

function FAQPage() {
  const categories = Array.from(new Set(FAQ_ITEMS.map((item) => item.category)));

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-400 overflow-x-hidden font-sans">
      <AmbientBackground />
      <LandingNavbar />

      <main className="relative z-10 pt-28 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <span className="text-emerald-400 font-semibold">FAQ</span>
          </nav>

          {/* Hero Section */}
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400">
              <HelpCircle className="size-3.5" />
              <span>KNOWLEDGE BASE • FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              DevOS is an all-in-one developer workspace that manages learning, projects, goals, habits, jobs, notes, and coding profiles in one place. Explore direct answers below covering our 14 integrated modules, privacy-first developer utilities, and how DevOS compares to traditional productivity tools.
            </p>
          </header>

          {/* Quick Category Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Layers className="size-3.5" />
                <span>14 Modules</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Unified workspace</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <Code2 className="size-3.5" />
                <span>Live Stats</span>
              </div>
              <p className="text-[11px] text-muted-foreground">LeetCode & Codeforces</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Wrench className="size-3.5" />
                <span>Free Utilities</span>
              </div>
              <p className="text-[11px] text-muted-foreground">100% Client-side</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
                <Lock className="size-3.5" />
                <span>Secure RLS</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Private database</p>
            </div>
          </div>

          {/* Categorized FAQ Sections */}
          <div className="space-y-10">
            {categories.map((category) => {
              const categoryItems = FAQ_ITEMS.filter((item) => item.category === category);

              return (
                <section key={category} className="space-y-4">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {category}
                  </h2>

                  <Accordion type="multiple" className="w-full space-y-2">
                    {categoryItems.map((item) => (
                      <AccordionItem
                        key={item.id}
                        value={item.id}
                        className="rounded-lg border border-border/50 bg-card/60 px-4 backdrop-blur-sm transition-colors hover:border-border"
                      >
                        <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline hover:text-emerald-400 py-3.5">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4 pt-1 space-y-2">
                          <p>{item.answer}</p>
                          {item.link && (
                            <div>
                              <Link
                                to={item.link.href}
                                className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 hover:underline pt-1"
                              >
                                {item.link.text}
                                <ChevronRight className="size-3" />
                              </Link>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              );
            })}
          </div>

          {/* CTA Footer Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-background p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Ready to centralize your developer workflow?
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Join software engineers, competitive programmers, and students organizing their learning, projects, coding stats, and job applications in DevOS.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Link to="/auth">
                  Get Started Free
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/features">Explore All 14 Modules</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

