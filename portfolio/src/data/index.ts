export const personal = {
  name: "Kevan Wee",
  fullName: "Kevan Wee Jia Wei",
  title: "Computing & Law",
  institution: "Singapore Management University",
  description:
    "Building systems at the intersection of law and technology. Translating legal rules into intelligent, scalable software.",
  email: "kevan.wee.2023@scis.smu.edu.sg",
  linkedin: "https://www.linkedin.com/in/kevanwee/",
  github: "https://github.com/kevanwee",
  instagram: "https://www.instagram.com/kwjw30/",
  funPortfolio: "https://kevanweeportfolio.vercel.app/",
};

export const aboutParagraphs = [
  "I'm a penultimate-year undergraduate at Singapore Management University reading Computing & Law, with a second major in Cybersecurity.",
  "My work spans the intersection of law and software. I design and build tools that translate legal rules into automated systems, covering platform regulation, IP enforcement, data protection compliance, contract lifecycle management, and court document automation.",
  "Previously, I served as a Senior Geospatial Mapper in the Singapore Armed Forces' Digital and Intelligence Service, leading geospatial intelligence operations across MINDEF/SAF and Whole-of-Government agencies.",
];

export const achievements = [
  "SMU Legal Innovation & Technology Hackathon 2025 – Ministry of Law Track Winner & Finalist",
  "DBS × SG Courts Hackathon for a Better World 2024 – Most Innovative",
  "RelativityOne Certified Professional",
  "Teaching Assistant – IS210 Business Process Analysis & Solutioning; IS215 Digital Business: Technologies & Transformation",
];

export const education = {
  institution: "Singapore Management University",
  degree: "B.Sc. Computing & Law",
  secondMajor: "2nd Major in Cybersecurity",
  expected: "Aug 2023 – May 2027",
};

export interface Experience {
  id: string;
  company: string;
  role: string;
  subtitle: string;
  period: string;
  type: string;
  url: string;
  bullets: string[];
  proSono?: boolean;
  logo?: string;
}

export const experiences: Experience[] = [
  {
    id: "smu-scis",
    logo: "/logos/smu.jpg",
    company: "SMU School of Computing & Information Systems",
    role: "Research Assistant",
    subtitle: "DeFi Security & Software Supply Chain Security",
    period: "Jan 2026 – Present",
    type: "Part-time",
    url: "https://scis.smu.edu.sg/",
    bullets: [
      "Researching DeFi vulnerabilities and Web3 bug bounties/audit competitions to analyse exploit trends and remediation data, exploring how audits, disclosures, and governance can be integrated into product lifecycles and CI/CD for more resilient platforms.",
      "Built NLP pipelines using SetFit (few-shot sentence-transformer classification) and engineered ETL + labeling workflows to classify root-cause patterns and severity across Immunefi and Sherlock vulnerability disclosures.",
    ],
  },
  {
    id: "osborne",
    logo: "/logos/osborneclarke.png",
    company: "Osborne Clarke",
    role: "Legal Intern",
    subtitle: "Corporate + Technology, Media, and Telecom",
    period: "Dec 2025 – Jan 2026",
    type: "Internship",
    url: "https://www.osborneclarke.com/",
    bullets: [
      "Examined content-platform liability and IP enforcement risks, translating regulation into operational governance decisions for digital marketplaces.",
      "Evaluated product-compliance trade-offs (content reuse, scraping), balancing platform growth with regulatory risk.",
      "Contributed to structured playbooks for early-stage ventures, formalising governance, escalation and decision-rights mechanisms.",
    ],
  },
  {
    id: "pwc",
    logo: "/logos/pwc.jpg",
    company: "PricewaterhouseCoopers LLP",
    role: "NewLaw Intern",
    subtitle: "Legal Management Consulting",
    period: "May 2025 – Aug 2025",
    type: "Internship",
    url: "https://www.pwc.com/sg/",
    bullets: [
      "Supported APAC legal digital transformation initiatives for law firms and in-house legal teams.",
      "Developed structured comparison datasets for 30 NDAs and Tax LOEs, standardising clause equivalencies to support contract harmonisation and CLM implementation.",
      "Applied data analysis on 3,000+ law-firm partnership and headcount records to uncover structural trends and performance indicators.",
      "Performed cross-jurisdictional analysis of GenAI regulatory frameworks, translating legal requirements into operational constraints.",
    ],
  },
  {
    id: "imda",
    logo: "/logos/imda.png",
    company: "Infocomm Media Development Authority",
    role: "Data Analyst",
    subtitle: "",
    period: "May 2025 – Jun 2025",
    type: "Freelance",
    url: "https://www.imda.gov.sg/",
    bullets: [
      "Analysed 500 annual contract reviews and clearance records across IMDA divisions to surface process milestones, bottlenecks, and root causes of delays.",
      "Built a Python ETL/reporting pipeline (pandas, openpyxl, python-docx, PyYAML, OpenXML) to automate legal contract-clearance analytics and generate division-level Excel and Word reports, surfacing delay bottlenecks, root causes, and process inefficiencies.",
    ],
  },
  {
    id: "smu-law",
    logo: "/logos/smu.jpg",
    company: "SMU Yong Pung How School of Law",
    role: "Research Assistant",
    subtitle: "Centre for Digital Law",
    period: "Dec 2024 – Aug 2025",
    type: "Part-time",
    url: "https://law.smu.edu.sg/",
    bullets: [
      "Built a structured dataset of 500 Legal NLP papers, reviewing proceedings of general NLP conferences (ROCLING, RANLP) and specialised Legal NLP gatherings (Jurix, ICAIL, ISAIL).",
      "Conducted an in-depth literature review supporting the paper \"Natural Language Processing in the Legal Domain\".",
    ],
  },
  {
    id: "cjc",
    logo: "/logos/state-courts.png",
    company: "State Courts · The Community Justice Centre",
    role: "Legal Technologist & OSLAS Volunteer",
    subtitle: "On-site Legal Advice Scheme",
    period: "Oct 2024 – Jan 2026",
    type: "Pro Bono",
    url: "https://cjc.org.sg/",
    proSono: true,
    bullets: [
      "Automated retrieval of court documents in collaboration with Thomson Reuters to streamline access to relevant court forms.",
      "Performed on-site triage, intake assessment and referral routing for unrepresented litigants.",
    ],
  },
  {
    id: "rnt",
    logo: "/logos/rajah_tann_technologies_logo.jpg",
    company: "Rajah & Tann Technologies",
    role: "LegalTech Intern",
    subtitle: "",
    period: "Jun 2024 – Nov 2024",
    type: "Internship",
    url: "https://www.rajahtanntech.com/",
    bullets: [
      "Executed PoC projects evaluating emerging technologies including ZTNA solutions and AI-powered legal document management.",
      "Performed data preprocessing for eDiscovery and production of documents in ongoing legal cases.",
      "Configured a Linux server to enable RDP login for Rajah & Tann's forensic workstations.",
    ],
  },
  {
    id: "tito",
    logo: "/logos/titoisaac.jpg",
    company: "Tito Isaac & Co LLP",
    role: "Legal Intern",
    subtitle: "Litigation & Dispute Resolution",
    period: "Apr 2023 – May 2023",
    type: "Internship",
    url: "#",
    bullets: [
      "Conducted legal research and assisted in litigation involving SOPA claims, drafted affidavits, and assisted in deputyship and family law proceedings.",
    ],
  },
  {
    id: "dis",
    logo: "/logos/dis.jpg",
    company: "The Digital & Intelligence Service",
    role: "Senior Geospatial Mapper",
    subtitle: "Operations Specialist",
    period: "Jan 2021 – Apr 2023",
    type: "Full-time (NS)",
    url: "https://www.mindef.gov.sg/",
    bullets: [
      "Led geospatial intelligence operations, managing 150 personnel and coordinating cross-agency stakeholders to deliver large-scale GIS support for MINDEF/SAF and Whole-of-Government agencies.",
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
  collabLogo?: string;
}

export interface OtherProject {
  title: string;
  description: string;
  tags: string[];
  github: string | null;
  external: string | null;
}

export interface MediaAppearance {
  outlet: string;
  title: string;
  description: string;
  date: string;
  url: string;
  type: "Profile" | "Interview" | "Article" | "Feature";
}

export const mediaAppearances: MediaAppearance[] = [
  {
    outlet: "Rajah & Tann Asia",
    title: "Rajah & Tann wins Most Innovative award at the DBS x SG Courts Hackathon for a Better World 2024",
    description: "",
    date: "2024",
    url: "https://www.judiciary.gov.sg/news-and-resources/news/news-details/joint-media-release--hackathon-for-a-better-world-2024-winners-devise-innovative-solutions-that-strengthen-access-to-justice-and-fortify-community-trust",
    type: "Feature",
  },
  {
    outlet: "SMU – School of Computing and Information Systems",
    title: "As the new semester approaches, it also marks the bittersweet end of internship with PwC Singapore for BSc (Computing and Law) student...",
    description: "",
    date: "2025",
    url: "https://computing.smu.edu.sg/news",
    type: "Feature",
  },
  {
    outlet: "SMU – School of Computing and Information Systems",
    title: "BSc (Computing and Law) student Kevan Wee's internship with Rajah & Tann Technologies...",
    description: "",
    date: "2024",
    url: "https://computing.smu.edu.sg/news",
    type: "Feature",
  },
  {
    outlet: "SMU – School of Computing and Information Systems",
    title: "The end of internship doesn't always mean the end of your time there. BSc (Computing and Law) student...",
    description: "",
    date: "2024",
    url: "https://computing.smu.edu.sg/news",
    type: "Feature",
  },
  {
    outlet: "Singapore Management University",
    title: "Which SMU Tech Degree Is Right for You? What to Consider Before Choosing",
    description: "",
    date: "2024",
    url: "https://www.smu.edu.sg/",
    type: "Feature",
  },
];

export const featuredProjects: FeaturedProject[] = [
  {
    id: "bart",
    title: "BART",
    description:
      "Final Year Project in collaboration with Allen & Overy Shearman. A Microsoft Word add-in that scans and verifies statutory citations in legal documents against Singapore Statutes Online. Features hybrid retrieval (BM25 + Qwen3 dense embeddings, cross-encoder reranking via ChromaDB) and fuzzy act/section matching for version-accurate citation checking.",
    tags: ["Next.js", "Python", "FastAPI", "ChromaDB", "Office.js", "LegalTech"],
    github: null,
    external: null,
    isPrivate: true,
    collab: "Allen & Overy Shearman",
    collabLogo: "/logos/allenandoveryshearman.png",
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
      "An independent open-access benchmarking platform for legal AI tools built by the global legal community. Provides structured evaluation frameworks with 100+ assessment factors across contract drafting, information extraction, and legal workflows. Contributing as a Steering Committee member alongside practitioners from Google, PayPal, Netflix, and Stripe.",
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
      "Contract playbook harmonisation tool that identifies and reconciles conflicting clauses across multiple contract versions for M&A due diligence.",
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
      "BeautifulSoup4 scraper extracting Singapore court case data from the eLitigation portal.",
    tags: ["Python", "BeautifulSoup", "Legal Data"],
    github: "https://github.com/kevanwee/elitiscraper",
    external: null,
  },
  {
    title: "sg statute scraper",
    description:
      "Scraper for Singapore Statutes Online (sso.agc.gov.sg) extracting legislative text for NLP pipelines. (WIP)",
    tags: ["Python", "BeautifulSoup", "Legal Data"],
    github: "https://github.com/kevanwee/sgstatutescraper",
    external: null,
  },
  {
    title: "hansard scraper",
    description:
      "Parliamentary debate scraper extracting Singapore Hansard records for legislative history research. (WIP)",
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
