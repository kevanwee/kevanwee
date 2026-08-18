export const personal = {
  name: "Kevan Wee",
  fullName: "Kevan Wee Jia Wei",
  title: "Computing & Law",
  institution: "Singapore Management University",
  description:
    "Building systems at the intersection of law and technology. Translating legal rules into intelligent, scalable software.",
  tagline: "LegalTech · LegalOps · Legal AI",
  email: "kevan.wee.2023@scis.smu.edu.sg",
  linkedin: "https://www.linkedin.com/in/kevanwee/",
  github: "https://github.com/kevanwee",
  instagram: "https://www.instagram.com/kwjw30/",
  funPortfolio: "https://kevanweeportfolio.vercel.app/",
};

export const aboutParagraphs = [
  "I design and build software that operationalises legal processes, turning regulatory rules, contract logic, and compliance workflows into automated, auditable systems. My work spans platform regulation, IP enforcement, data protection, contract lifecycle management, and court document automation.",
  "Currently a final-year undergraduate at Singapore Management University pursuing a BSc in Computing & Law (magna cum laude), with a second major in Computing Studies (Cybersecurity).",
  "Previously, I served as a Senior Geospatial Mapper in the Singapore Armed Forces' Digital and Intelligence Service, leading geospatial intelligence operations across MINDEF/SAF and Whole-of-Government agencies.",
];

export const achievements = [
  "SMU Legal Innovation & Technology Hackathon 2025 – Ministry of Law Track Winner & Finalist",
  "DBS × SG Courts Hackathon for a Better World 2024 – Most Innovative",
  "RelativityOne Certified Professional",
  "Harvey Academy – Legal Engineering Certification",
  "Teaching Assistant – IS210 Business Process Analysis & Solutioning; IS212 Software Project Management; IS215 Digital Business: Technologies & Transformation",
];

export const education = {
  institution: "Singapore Management University",
  degree: "B.Sc. Computing & Law",
  secondMajor: "2nd Major in Computing Studies (Cybersecurity)",
  expected: "Aug 2023 – May 2027",
};

export interface EducationEntry {
  institution: string;
  logo: string;
  qualification: string;
  period: string;
  grade?: string;
  activities?: string[];
  leadership?: string[];
  achievements?: string[];
}

export const educationHistory: EducationEntry[] = [
  {
    institution: "Singapore Management University",
    logo: "/logos/smu.jpg",
    qualification: "Bachelor of Science (Computing & Law) · 2nd Major in Computing Studies (Cybersecurity)",
    period: "Aug 2023 – May 2027",
    grade: "GPA 3.62 / 4.00 · Magna Cum Laude",
    activities: [
      "SMU Bowling",
      "Teaching Assistant: IS210 Business Process Analysis & Solutioning",
      "Teaching Assistant: IS212 Software Project Management",
      "Teaching Assistant: IS215 Digital Business: Technologies & Transformation",
      "Research Assistant: DeFi Security",
      "Research Assistant: Legal NLP",
      "Student Assistant: Open House AY2026",
    ],
    achievements: [
      "DBS × SG Courts Hackathon for a Better World 2024 — Most Innovative",
      "SMU Legal Innovation & Technology Hackathon — Finalist and Track Winner (Ministry of Law, Legal Technology and Transformation Office)",
      "A&G YPHSL Writing Competition 2025",
    ],
  },
  {
    institution: "University of Tokyo (東京大学)",
    logo: "/logos/utokyo.svg",
    qualification: "Summer Exchange (GUC) · Law in Transnational East Asia",
    period: "July 2026",
  },
  {
    institution: "Dunman High School",
    logo: "/logos/dhs.jpg",
    qualification: "GCE A Levels · Science Stream (4H2 Physics, Further Mathematics, Mathematics, Economics)",
    period: "2019 – 2020",
    activities: [
      "Executive President of Dunman High School (2019–2020)",
      "Student Council (2019–2020)",
    ],
    achievements: [
      "Awarded the Harvard Prize Book (2021)",
      "First Runner-up, Lee Kuan Yew Futures Thinking And Scenario Planning Workshop",
      "First team to represent Dunman High School in the International Mathematical Modelling Competition (IMMC)",
      "Mentored Dunman High School's Flagship event, Leadership Symposium 2020",
      "Implemented cashless payment systems in the school canteen in collaboration with the School Management Committee",
      "Engaged the student body regularly and worked on various initiatives alongside relevant stakeholders in support of reinforcing school identity and bolstering student welfare",
      "Represented Dunman High School in ceremonial events",
    ],
  },
  {
    institution: "Dunman High School",
    logo: "/logos/dhs.jpg",
    qualification: "IP Programme",
    period: "2015 – 2018",
    activities: ["Infocomm Club (2015–2018)"],
    leadership: [
      "Infocomm Club Vice-Chairperson (2017–2018)",
      "Class Treasurer (2017)",
      "Class National Education Ambassador (2015–2016)",
    ],
    achievements: [
      "Bebras Computational Thinking Challenge — Gold Award (2018)",
      "National Software Competition — Bronze Award (2018)",
      "National Software Competition — Finalist (2017)",
      "[i.code] Best Presentation (2017)",
      "Bebras Computational Thinking Challenge — Bronze Award (2017)",
    ],
  },
];

export interface Experience {
  id: string;
  company: string;
  role: string;
  subtitle: string;
  period: string;
  type: string;
  url: string;
  bullets: string[];
  bulletTags?: ("tech" | "legal")[][];
  proSono?: boolean;
  logo?: string;
}

export const experiences: Experience[] = [
  {
    id: "shopee",
    logo: "/logos/shopee.svg",
    company: "Shopee",
    role: "Regional Brand Protection Analyst (IPR)",
    subtitle: "Regional Brand Partnerships",
    period: "May 2026 – Present",
    type: "Internship",
    url: "https://shopee.com/",
    bullets: [
      "Managed 400+ e-commerce IPR enforcement cases across 10+ APAC and LATAM markets as direct point of contact for global brand partners, coordinating cross-border takedowns and resolving high-priority trademark and copyright escalations across Operations, Legal, and Product.",
      "Owned IPR volume and SLA tracking for priority brands across FMCG, Electronics, Beauty, and Fashion & Lifestyle via regional dashboards.",
      "Authored quarterly Brand Protection newsletter, consolidating regional IP enforcement updates and stakeholder inputs for external brand partners.",
    ],
    bulletTags: [
      ["legal"],
      ["tech", "legal"],
      ["legal"],
    ],
  },
  {
    id: "smu-cdl-solid",
    logo: "/logos/smu.jpg",
    company: "SMU Yong Pung How School of Law",
    role: "Research Engineer",
    subtitle: "Centre for Digital Law · Singapore Open Legal Informatics Database",
    period: "Jul 2026 – Present",
    type: "Part-time",
    url: "https://cdl.smu.edu.sg/",
    bullets: [
      "Contributing to Singapore's first open quantitative legal database, in collaboration with the Ministry of Law to enable data-driven legal research.",
      "Extracting and verifying structured data from Singapore case law and statutes, with additional contributions to the project's data pipeline codebase.",
    ],
    bulletTags: [
      ["tech", "legal"],
      ["tech"],
    ],
  },
  {
    id: "smu-scis",
    logo: "/logos/smu.jpg",
    company: "SMU School of Computing & Information Systems",
    role: "Undergraduate Researcher",
    subtitle: "DeFi Security",
    period: "Jan 2026 – Present",
    type: "Part-time",
    url: "https://scis.smu.edu.sg/",
    bullets: [
      "Developed a systemic risk classification framework validated against 4,000+ vulnerability disclosures using an LLM-assisted extraction and classification pipeline, surfacing cross-component risk patterns relevant to security governance.",
      "Built ETL and NLP pipelines to structure and classify large volumes of unstructured disclosure data, enabling analysis of cross-component risk.",
    ],
    bulletTags: [
      ["tech"],
      ["tech"],
    ],
  },
  {
    id: "osborne",
    logo: "/logos/osborneclarke.png",
    company: "Osborne Clarke",
    role: "Legal Intern",
    subtitle: "Corporate, Technology, Media & Telecom",
    period: "Dec 2025 – Jan 2026",
    type: "Internship",
    url: "https://www.osborneclarke.com/",
    bullets: [
      "Advised on registered design protection and contractual IP ownership transfer, translating regulatory risk into governance recommendations.",
      "Analysed platform liability for marketplaces hosting third-party seller listings, covering IP infringement risk and product-compliance obligations.",
    ],
    bulletTags: [
      ["legal"],
      ["legal"],
    ],
  },
  {
    id: "pwc",
    logo: "/logos/pwc.jpg",
    company: "PricewaterhouseCoopers LLP",
    role: "NewLaw Intern",
    subtitle: "LegalTech / LegalOps Consulting",
    period: "May 2025 – Aug 2025",
    type: "Internship",
    url: "https://www.pwc.com/sg/",
    bullets: [
      "Produced clause equivalency mappings adopted in live CLM implementations, standardising across 30 NDAs and Tax LOEs for client engagements and PwC's internal Tax practice.",
      "Analysed 3,000+ law-firm partnership and headcount records, producing insights on structural trends for strategy decks.",
      "Conducted cross-jurisdictional analysis of AI regulatory frameworks, translating legal requirements into operational constraints for APAC clients.",
    ],
    bulletTags: [
      ["tech", "legal"],
      ["tech"],
      ["tech", "legal"],
    ],
  },
  {
    id: "imda",
    logo: "/logos/imda.png",
    company: "Infocomm Media Development Authority",
    role: "Data Analyst",
    subtitle: "Group Legal",
    period: "May 2025 – Jun 2025",
    type: "Contract",
    url: "https://www.imda.gov.sg/",
    bullets: [
      "Presented workflow remediation findings to the General Counsel, drawn from Python ETL analysis of 1,500 contract review and clearance records across IMDA divisions to identify bottlenecks and handoff delays.",
      "Built a Python ETL/reporting pipeline (pandas, openpyxl, python-docx, PyYAML, OpenXML) to automate legal contract-clearance analytics and generate division-level Excel and Word reports.",
    ],
    bulletTags: [
      ["legal"],
      ["tech"],
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
      "Built a 500-paper structured dataset on Legal NLP, reviewing proceedings of general NLP conferences (ROCLING, RANLP) and specialised legal NLP gatherings (Jurix, ICAIL, ISAIL).",
      "Conducted an in-depth literature review supporting the paper \"NLP in the Legal Domain\".",
    ],
    bulletTags: [
      ["tech", "legal"],
      ["legal"],
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
      "Evaluated Thomson Reuters CoCounsel for court user guidance and public-facing procedural use cases.",
      "Provided weekly on-site legal triage and intake assessment, routing court users to appropriate referral pathways.",
    ],
    bulletTags: [
      ["tech"],
      ["legal"],
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
      "Presented technology deployment recommendations to the CEO and COO after owning the end-to-end PoC lifecycle for ZTNA, AI document management, and workflow automation products, including evaluation criteria and vendor assessments with practice-side stakeholders.",
      "Supported the forensics team's remote workflow infrastructure, including Linux server configuration for RDP access; built data preprocessing pipelines for eDiscovery and document production in ongoing legal cases.",
    ],
    bulletTags: [
      ["tech"],
      ["tech", "legal"],
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
    bulletTags: [
      ["legal"],
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
      "Led geospatial intelligence operations across MINDEF/SAF and Whole-of-Government agencies, coordinating large-scale production workflows across upwards of 100 personnel and managing cross-agency stakeholder requirements.",
      "Evaluated and optimised HADR and Peace Support Operations procedures, redesigning map production workflows and coordinating unit-level output for large-scale operational readiness.",
      "Streamlined Imagery Support Group's manpower status reporting by building a unified tracking platform, reducing process fragmentation across the unit; headed unit administration, security, and NSF welfare.",
    ],
    bulletTags: [
      ["tech"],
      ["tech"],
      ["tech"],
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
  hasCaseStudy?: boolean;
  role?: string;
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
    outlet: "Channel News Asia",
    title: "The Big Read: With AI doing the grunt work in law firms, where does this leave junior lawyers and fresh grads?",
    description: "",
    date: "2026",
    url: "https://www.channelnewsasia.com/today/big-read/ai-junior-lawyers-job-relevance-new-skills-6005796",
    type: "Article",
  },
  {
    outlet: "Singapore Management University",
    title: "Which SMU Tech Degree Is Right for You? What to Consider Before Choosing",
    description: "",
    date: "2024",
    url: "https://blog.smu.edu.sg/story/which-smu-tech-degree-consider-before-choosing",
    type: "Feature",
  },
  {
    outlet: "SMU – School of Computing and Information Systems",
    title: "As the new semester approaches, it also marks the bittersweet end of internship with PwC Singapore for BSc (Computing and Law) student...",
    description: "",
    date: "2025",
    url: "https://www.instagram.com/p/DNR2Nr7P-Ni/",
    type: "Feature",
  },
  {
    outlet: "Rajah & Tann Asia",
    title: "Rajah & Tann wins Most Innovative award at the DBS x SG Courts Hackathon for a Better World 2024",
    description: "",
    date: "2024",
    url: "https://www.linkedin.com/posts/rajah-%26-tann_technology-digitaltransformation-legalclinic-activity-7259376381191479299-xrQx?utm_source=li_share&utm_content=feedcontent&utm_medium=g_dt_web&utm_campaign=copy",
    type: "Feature",
  },
  {
    outlet: "SMU – School of Computing and Information Systems",
    title: "BSc (Computing and Law) student Kevan Wee's internship with Rajah & Tann Technologies...",
    description: "",
    date: "2024",
    url: "https://www.instagram.com/p/DB7tIbtTl3_/",
    type: "Feature",
  },
  {
    outlet: "SMU – School of Computing and Information Systems",
    title: "The end of internship doesn't always mean the end of your time there. BSc (Computing and Law) student...",
    description: "",
    date: "2024",
    url: "https://www.instagram.com/p/C_cFPGryaLW/",
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
    hasCaseStudy: true,
    role: "Team Lead · Scrum Master · Software Developer",
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
