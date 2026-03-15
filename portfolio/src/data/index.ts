export const personal = {
  name: "Kevan Wee",
  title: "Computing & Law",
  institution: "Singapore Management University",
  description:
    "I build systems at the intersection of law and technology — translating legal rules into intelligent, scalable software.",
  email: "kevan.wee.2023@scis.smu.edu.sg",
  linkedin: "https://www.linkedin.com/in/kevanwee/",
  github: "https://github.com/kevanwee",
  instagram: "https://www.instagram.com/kwjw30/",
  funPortfolio: "https://kevanweeportfolio.vercel.app/",
};

export const aboutParagraphs = [
  "I'm a penultimate-year undergraduate at Singapore Management University reading Computing & Law, with a second major in Cybersecurity.",
  "My work spans the intersection of law and software — I design and build tools that translate legal rules into automated systems. This covers platform regulation, intellectual property enforcement, data protection compliance, and court document automation.",
  "I volunteer with Singapore's Community Justice Centre automating court documents with AI, and assist at the State Courts' On-Site Legal Advice Scheme, helping members of the public navigate civil matters.",
  "Previously, I served as a Senior Geospatial Mapper in the Singapore Armed Forces' Digital & Intelligence Service, specialising in GEOINT, cartography, and satellite imagery analysis.",
];

export const achievements = [
  "SMU Legal Innovation & Technology Hackathon — Track Winner (2025)",
  "DBS × SG Courts Hackathon — Most Innovative (2024)",
  "RelativityOne Certified Professional (2025)",
  "LegalBenchmarks.ai Steering Committee",
  "LegalQuants",
  "Mensa International",
];

export const education = {
  institution: "Singapore Management University",
  degree: "B.Sc. (Hons) Computing & Law",
  secondMajor: "2nd Major in Cybersecurity",
  expected: "Class of 2027",
};

export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  type: string;
  url: string;
  bullets: string[];
}

export const experiences: Experience[] = [
  {
    id: "smu-ra",
    company: "SMU",
    role: "Research Assistant",
    period: "Jan 2026 — Present",
    type: "Part-time",
    url: "https://www.smu.edu.sg/",
    bullets: [
      "Conducting academic research at the intersection of law and technology at Singapore Management University.",
    ],
  },
  {
    id: "osborne",
    company: "Osborne Clarke",
    role: "Legal Intern",
    period: "Dec 2025 — Jan 2026",
    type: "Internship",
    url: "https://www.osborneclarke.com/",
    bullets: [
      "Legal internship at international law firm specialising in technology, digital business, and innovation-driven sectors.",
    ],
  },
  {
    id: "pwc",
    company: "PwC",
    role: "Tax NewLaw Intern",
    period: "May 2025 — Aug 2025",
    type: "Internship",
    url: "https://www.pwc.com/sg/",
    bullets: [
      "Worked within PwC Singapore's Tax NewLaw practice at the crossroads of legal services and emerging technology.",
    ],
  },
  {
    id: "imda",
    company: "IMDA",
    role: "Data Analyst",
    period: "May 2025 — Jun 2025",
    type: "Internship",
    url: "https://www.imda.gov.sg/",
    bullets: [
      "Data analysis at Singapore's national regulatory authority for the infocomm and media sectors.",
    ],
  },
  {
    id: "rnt",
    company: "Rajah & Tann",
    role: "LegalTech Intern",
    period: "Jun 2024 — Nov 2024",
    type: "Internship",
    url: "https://www.rajahtanntech.com/",
    bullets: [
      "Implemented digital risk management, AML-CTF, and LegalTech solutions for the firm.",
      "Evaluated emerging technologies including Zero Trust Network Access (ZTNA), AI-powered document management, and e-Discovery automation for due diligence.",
      "Conducted legal research to identify industries requiring enhanced Customer Due Diligence.",
      "Configured a Linux server for remote desktop access to forensic workstations.",
      "Represented Rajah & Tann Asia at the DBS × SG Courts Hackathon 2024, winning Most Innovative.",
    ],
  },
  {
    id: "cjc",
    company: "Community Justice Centre",
    role: "Pro Bono LegalTech",
    period: "Oct 2024 — Jan 2026",
    type: "Pro Bono",
    url: "https://cjc.org.sg/",
    bullets: [
      "Automating court document preparation using AI to support unrepresented litigants.",
    ],
  },
  {
    id: "scolas",
    company: "State Courts",
    role: "On-Site Legal Advice Scheme",
    period: "Mar 2025 — Jan 2026",
    type: "Pro Bono",
    url: "https://www.statecourts.gov.sg/",
    bullets: [
      "Assisted members of the public with civil legal matters at the State Courts of Singapore.",
    ],
  },
  {
    id: "tito",
    company: "Tito Isaac & Co",
    role: "Legal Intern",
    period: "Apr 2023 — May 2023",
    type: "Internship",
    url: "#",
    bullets: [
      "Conducted legal research in Civil Litigation, Dispute Resolution, Criminal Law, and Family Law.",
      "Drafted affidavits and prepared deputyship applications.",
      "Prepared verbatim attendance notes for pre-trial conferences and court hearings.",
    ],
  },
  {
    id: "dis",
    company: "Digital & Intelligence Service",
    role: "Senior Geospatial Mapper",
    period: "Jan 2021 — Apr 2023",
    type: "Full-time (NS)",
    url: "https://www.mindef.gov.sg/",
    bullets: [
      "Led and supervised a team of 10 full-time National Servicemen within the SAF Mapping Unit, Imagery Support Group.",
      "Managed provision of geospatial products and services to MINDEF/SAF and Whole-of-Government agencies, supporting operations, training, and mission planning.",
      "Streamlined Imagery Support Group manpower reporting by building a unified tracking platform.",
      "Evaluated and optimised HADR and Peace Support Operations procedures and map production workflows.",
      "Awarded Best Soldier of the Month (November 2021) and Commander of the Quarter (Q2 2022).",
    ],
  },
];

export interface FeaturedProject {
  id: string;
  title: string;
  description: string;
  tags: string[];
  github: string | null;
  external: string | null;
  isPrivate: boolean;
  collab: string | null;
}

export interface OtherProject {
  title: string;
  description: string;
  tags: string[];
  github: string | null;
  external: string | null;
}

export const featuredProjects: FeaturedProject[] = [
  {
    id: "bart",
    title: "BART",
    description:
      "Final Year Project in collaboration with Allen & Overy Shearman. A Microsoft Word add-in that scans and verifies statutory citations in legal documents against Singapore Statutes Online. Features hybrid retrieval (BM25 + Qwen3 dense embeddings, cross-encoder reranking via ChromaDB) and fuzzy act/section matching for version-accurate citation checking.",
    tags: ["Next.js", "Python", "FastAPI", "ChromaDB", "Office.js", "LegalTech"],
    github: "https://github.com/kevanwee/bart",
    external: null,
    isPrivate: true,
    collab: "Allen & Overy Shearman",
  },
  {
    id: "copycat",
    title: "copycat",
    description:
      "Singapore-first copyright infringement triage tool with deterministic similarity scoring. Automates the initial assessment of IP claims against Singapore copyright law frameworks, helping legal practitioners quickly evaluate likely outcomes and prioritise cases.",
    tags: ["Python", "NLP", "LegalTech", "IP Law"],
    github: "https://github.com/kevanwee/copycat",
    external: null,
    isPrivate: false,
    collab: null,
  },
  {
    id: "legalbenchmarks",
    title: "LegalBenchmarks.ai",
    description:
      "An independent open-access benchmarking platform for legal AI tools, built by the global legal community. Provides structured evaluation frameworks with 100+ assessment factors across contract drafting, information extraction, and other legal workflows. Contributing as a Steering Committee member alongside legal technology leaders from Google, PayPal, Netflix, and Stripe.",
    tags: ["Legal AI", "Evaluation", "LegalTech", "Research"],
    github: null,
    external: "https://www.legalbenchmarks.ai/",
    isPrivate: false,
    collab: null,
  },
];

export const otherProjects: OtherProject[] = [
  {
    title: "sightstone",
    description:
      "Contract playbook harmonisation tool that identifies and reconciles conflicting clauses across multiple contract versions for M&A due diligence workflows.",
    tags: ["Python", "NLP", "Contract Law"],
    github: "https://github.com/kevanwee/sightstone",
    external: null,
  },
  {
    title: "sal citation generator",
    description:
      "TypeScript citation generator for Singapore Academy of Law style guide materials. (WIP)",
    tags: ["TypeScript", "LegalTech", "Citation"],
    github: "https://github.com/kevanwee/sal-citation-generator",
    external: null,
  },
  {
    title: "eliti scraper",
    description:
      "eLitigation scraper using BeautifulSoup4 to extract Singapore court case data from the eLitigation portal.",
    tags: ["Python", "BeautifulSoup", "Legal Data"],
    github: "https://github.com/kevanwee/elitiscraper",
    external: null,
  },
  {
    title: "sg statute scraper",
    description:
      "Scraper for Singapore Statutes Online (sso.agc.gov.sg) to extract and structure legislative text for downstream NLP pipelines. (WIP)",
    tags: ["Python", "BeautifulSoup", "Legal Data"],
    github: "https://github.com/kevanwee/sgstatutescraper",
    external: null,
  },
  {
    title: "hansard scraper",
    description:
      "Singapore parliamentary debate scraper that extracts Hansard records for legislative history research. (WIP)",
    tags: ["Python", "BeautifulSoup", "Legal Data"],
    github: "https://github.com/kevanwee/hansardscraper",
    external: null,
  },
  {
    title: "tort rat",
    description:
      "RAG-powered Discord chatbot for Singapore tort law using PostgresML and GPT-3.5 Turbo, deployed on AWS.",
    tags: ["Python", "RAG", "PostgresML", "AWS"],
    github: "https://github.com/kevanwee/tortrat",
    external: null,
  },
];
