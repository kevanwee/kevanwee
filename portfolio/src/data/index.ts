export const careerDocuments = [
  {
    id: "resume",
    available: true,
    label: "Resume",
    summary: "One-page overview",
    description: "A condensed, one-page overview of my experience and qualifications.",
    switchHint: "The full CV is currently being updated.",
    href: "/resume.pdf",
    filename: "Kevan_Wee_Resume.pdf",
  },
  {
    id: "cv",
    available: false,
    label: "CV",
    summary: "Work in progress",
    description: "Work in progress.",
    switchHint: "Select Resume for a condensed, one-page overview.",
    href: "/cv.pdf",
    filename: "Kevan_Wee_CV.pdf",
  },
] as const;

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
  "I'm a LegalTech builder and final-year Computing & Law undergraduate at Singapore Management University, with a second major in Computing Studies (Cybersecurity). I build tools that help legal teams turn manual, document-heavy work into structured, reliable systems.",
  "I've primarily worked on legal technology in BigLaw and in consulting for law firms and in-house legal teams. On the strictly legal side of things, my domain experience is concentrated in intellectual property and brand protection in e-commerce, handling cross-border IP enforcement and trademark and copyright escalations with global brand partners and teams across Legal, Operations, and Product. I currently contribute to Singapore's first open quantitative legal database at SMU's Centre for Digital Law, alongside DeFi security research with the School of Computing & Information Systems.",
  "I work between legal users, product teams, and AI systems: understanding how lawyers actually work, identifying where technology adds value, and turning legal requirements into working tools. That increasingly includes evaluating AI output against source material, testing it on real legal tasks, and feeding what breaks back to the people building the product.",
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
    grade: "Grade: A",
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
    id: "pwc-newlaw",
    logo: "/logos/pwc.jpg",
    company: "PwC",
    role: "???",
    subtitle: "NewLaw",
    period: "Oct 2026 – Present",
    type: "???",
    url: "https://www.pwc.com/sg/",
    bullets: [
      "Something is brewing here ☕",
    ],
  },
  {
    id: "smu-cdl-solid",
    logo: "/logos/smu.jpg",
    company: "SMU Yong Pung How School of Law",
    role: "Undergraduate Researcher",
    subtitle: "Centre for Digital Law · Singapore Open Legal Informatics Database",
    period: "Jul 2026 – Present",
    type: "Part-time",
    url: "https://cdl.smu.edu.sg/",
    bullets: [
      "Contributing to Singapore's first open quantitative legal database, in collaboration with the Ministry of Law to enable data-driven legal research.[[official launch]](https://news.smu.edu.sg/news/2025/11/18/smu-build-open-legal-database-support-ministry-law)",
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
    id: "shopee",
    logo: "/logos/shopee.svg",
    company: "Shopee",
    role: "Regional Brand Protection Analyst (IPR)",
    subtitle: "Regional Brand Partnerships",
    period: "May 2026 – Aug 2026",
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
      "Conducted an in-depth literature review supporting the paper [\"NLP in the Legal Domain\"](https://arxiv.org/pdf/2302.12039).",
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
    url: "https://www.judiciary.gov.sg/visit-us/state-courts",
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
    url: "https://sg.rajahtannasia.com/",
    bullets: [
      "Presented technology deployment recommendations to the CEO and COO after owning the end-to-end PoC lifecycle for ZTNA, AI document management, and workflow automation products, including evaluation criteria and vendor assessments with practice-side stakeholders.",
      "Supported the forensics team's remote workflow infrastructure, including Linux server configuration for RDP access; built data preprocessing pipelines for eDiscovery and document production in ongoing legal cases.",
      "Represented the firm at the DBS x SG Courts Hackathon for a Better World 2024 and attained \"Most Innovative\".[[official release]](https://www.dbs.com/newsroom/Hackathon_for_a_Better_World_2024_winners_devise_innovative_solutions_that_strengthen_access_to_justice_and_fortify_community_trust)",
    ],
    bulletTags: [
      ["tech"],
      ["tech", "legal"],
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
    url: "https://www.titoisaaclaw.com/",
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
  showGithubStars?: boolean;
  publications?: { label: string; url: string }[];
}

export type ProjectCategory = "legal-systems" | "agent-skills" | "other-experiments";

export interface OtherProject {
  category: ProjectCategory;
  title: string;
  description: string;
  tags: string[];
  github: string | null;
  external: string | null;
}

export interface MediaAppearance {
  outlet: string;
  title: string;
  /** Excerpt shown in the card's hover preview. */
  description: string;
  date: string;
  url: string;
  type: "Profile" | "Interview" | "Article" | "Feature";
  /** Self-hosted preview image; contain keeps group photos and page captures intact. */
  image?: { src: string; alt: string; position?: string; fit?: "cover" | "contain" };
  logo?: { src: string; alt: string };
}

export const mediaAppearances: MediaAppearance[] = [
  {
    outlet: "Channel News Asia",
    title: "The Big Read: With AI doing the grunt work in law firms, where does this leave junior lawyers and fresh grads?",
    description:
      "Grunt work “trained important habits of reading closely, spotting fine distinctions, understanding how judges reason, and developing the instinct to verify rather than accept things at face value”.",
    date: "2026",
    url: "https://www.channelnewsasia.com/today/big-read/ai-junior-lawyers-job-relevance-new-skills-6005796",
    type: "Article",
    image: { src: "/media/cna-ai-junior-lawyers.webp", alt: "Kevan Wee outside the Yong Pung How School of Law", position: "62% 30%" },
  },
  {
    outlet: "SMU – School of Computing and Information Systems",
    title: "With AI doing the grunt work in law firms, where does this leave junior lawyers and fresh grads?",
    description:
      "While repetitive, AI-aided legal tasks can be dull, they build vital skills like careful reading, recognising nuances and verifying information. Future training should emphasise deep, critical thinking even as AI streamlines low-value work.",
    date: "2026",
    url: "https://computing.smu.edu.sg/news/2026/mar/23/ai-doing-grunt-work-law-firms-where-does-leave-junior-lawyers-and-fresh-grads",
    type: "Article",
    image: { src: "/media/smu-scis-ai-junior-lawyers.webp", alt: "Kevan Wee outside the Yong Pung How School of Law", position: "63% 20%" },
  },
  {
    outlet: "Singapore Management University",
    title: "Which SMU Tech Degree Is Right for You? What to Consider Before Choosing",
    description:
      "“SMU’s Computing & Law programme has shaped how I approach challenges, not simply as a developer or a law student, but as someone focused on building responsible, practical, and impactful solutions.”",
    date: "2024",
    url: "https://blog.smu.edu.sg/story/which-smu-tech-degree-consider-before-choosing",
    type: "Feature",
    image: { src: "/media/smu-which-tech-degree.webp", alt: "Kevan Wee by the sea, featured in SMU's Computing & Law programme story", position: "center 66%" },
  },
  {
    outlet: "SMU – School of Computing and Information Systems",
    title: "As the new semester approaches, it also marks the bittersweet end of internship with PwC Singapore for BSc (Computing and Law) student...",
    description: "",
    date: "2025",
    url: "https://www.instagram.com/p/DNR2Nr7P-Ni/",
    type: "Feature",
    image: { src: "/media/smu-pwc-instagram.webp", alt: "Kevan Wee at PwC Singapore, from SMU SCIS's internship post", fit: "contain" },
  },
  {
    outlet: "Rajah & Tann Asia",
    title: "Rajah & Tann wins Most Innovative award at the DBS x SG Courts Hackathon for a Better World 2024",
    description:
      "Associates from Rajah & Tann Singapore's TMT Practice and interns from Rajah & Tann Technologies, Kevan Wee among them, won the Most Innovative Award at the DBS Bank x SG Courts Hackathon for A Better World 2024.",
    date: "2024",
    url: "https://www.linkedin.com/posts/rajah-%26-tann_technology-digitaltransformation-legalclinic-activity-7259376381191479299-xrQx?utm_source=li_share&utm_content=feedcontent&utm_medium=g_dt_web&utm_campaign=copy",
    type: "Feature",
    image: { src: "/media/rajah-tann-hackathon.webp", alt: "Rajah & Tann team receiving the Most Innovative Award", position: "center 78%" },
  },
  {
    outlet: "SMU – School of Computing and Information Systems",
    title: "BSc (Computing and Law) student Kevan Wee's internship with Rajah & Tann Technologies...",
    description: "",
    date: "2024",
    url: "https://www.instagram.com/p/DB7tIbtTl3_/",
    type: "Feature",
    image: { src: "/media/smu-rtt-instagram.webp", alt: "Kevan Wee and colleagues at the DBS and SG Courts Hackathon awards, from SMU SCIS's post", fit: "contain" },
  },
  {
    outlet: "SMU – School of Computing and Information Systems",
    title: "The end of internship doesn't always mean the end of your time there. BSc (Computing and Law) student...",
    description: "",
    date: "2024",
    url: "https://www.instagram.com/p/C_cFPGryaLW/",
    type: "Feature",
    image: { src: "/media/smu-internship-instagram.webp", alt: "Rajah & Tann Technologies colleagues gathered around a table, from SMU SCIS's internship post", fit: "contain" },
  },
];

export const legalQuantsProfile: MediaAppearance = {
  outlet: "LegalQuants",
  title: "Kevan Wee on LegalQuants",
  description: "Final-Year BSc (Computing & Law) | Legal AI & Platform IP",
  date: "",
  url: "https://www.legalquants.com/lawyers/kevan-wee",
  type: "Profile",
  image: { src: "/media/legalquants-profile.webp", alt: "Preview of Kevan Wee's LegalQuants profile page, including his photo and About section", fit: "contain" },
  logo: { src: "/media/legalquants-logo.png", alt: "LegalQuants logo" },
};

export const featuredProjects: FeaturedProject[] = [
  {
    id: "legalquants",
    title: "LegalQuants Plugins",
    role: "Contributor · Citation checking & playbooks",
    description:
      "Three open-source plugins for litigation, transactional work, and AI learning, published for OpenAI's ChatGPT Enterprise as part of the Astra for Law launch. Built by the LegalQuants community, they turn legal workflows such as citation checking, document review, and contract analysis into reusable skills. My contributions focused on the $cite-check and playbook skills.",
    tags: ["Legal AI", "Open Source", "ChatGPT", "LegalTech"],
    github: "https://github.com/LegalQuants/lq-plugin-oss",
    external: null,
    isPrivate: false,
    collab: null,
    showGithubStars: true,
    publications: [
      { label: "OpenAI announcement", url: "https://openai.com/index/astra-for-law/" },
      { label: "LegalQuants release", url: "https://www.legalquants.com/lqplugins" },
    ],
  },
  {
    id: "scrum-skill",
    title: "scrum-skill",
    role: "Creator",
    description:
      "Scrum coordination for Codex and Claude Code. Invoke it to create or resume a Scrum workspace, refine a backlog, plan and deliver a bounded slice, verify outcomes and leave a reliable handoff, with engineering, QA, design and domain reviewers chosen per project and a human Product Owner accountable for decisions. Ships as a plugin for both hosts, with a project dashboard skill.",
    tags: ["AI Agents", "Claude Code", "Codex", "Scrum", "Python"],
    github: "https://github.com/kevanwee/scrum-skill",
    external: null,
    isPrivate: false,
    collab: null,
  },
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
    id: "sal-citation-generator",
    title: "SAL Citation Generator",
    description:
      "TypeScript citation generator for Singapore Academy of Law style guide materials. (WIP)",
    tags: ["TypeScript", "LegalTech", "Citation"],
    github: "https://github.com/kevanwee/sal-citation-generator",
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
    title: "pmd-agents",
    category: "other-experiments",
    description:
      "VS Code extension that shows your Codex and Claude Code sessions as Pokémon in a Mystery Dungeon guild, across 73 animated Friend Areas.",
    tags: ["TypeScript", "VS Code", "AI Agents"],
    github: "https://github.com/kevanwee/pmd-agents",
    external: null,
  },
  {
    title: "copycat",
    category: "legal-systems",
    description:
      "Copyright infringement triage for Singapore law, with deterministic similarity scoring.",
    tags: ["Python", "NLP", "LegalTech", "IP Law"],
    github: "https://github.com/kevanwee/copycat",
    external: null,
  },
  {
    title: "bundlebuild",
    category: "legal-systems",
    description:
      "Builds court bundles from a YAML index, with PDF merging, page numbering, bookmarks, and input checks.",
    tags: ["Python", "PDF", "LegalTech"],
    github: "https://github.com/kevanwee/bundlebuild",
    external: null,
  },
  {
    title: "playbook-as-code",
    category: "legal-systems",
    description:
      "Structured contract negotiation playbooks with clause matching, review memos, and proposed amendments.",
    tags: ["Python", "YAML", "Contract Law"],
    github: "https://github.com/kevanwee/playbook-as-code",
    external: null,
  },
  {
    title: "crimewatch",
    category: "legal-systems",
    description:
      "Maps likely incident locations from Singapore criminal judgments using contextual extraction and weighted heatmaps.",
    tags: ["Python", "Flask", "Legal Data"],
    github: "https://github.com/kevanwee/crimewatch",
    external: null,
  },
  {
    title: "sightstone",
    category: "legal-systems",
    description:
      "Contract playbook harmonisation tool that identifies and reconciles conflicting clauses across multiple contract versions for M&A due diligence.",
    tags: ["Python", "NLP", "Contract Law"],
    github: "https://github.com/kevanwee/sightstone",
    external: null,
  },
  {
    title: "eliti scraper",
    category: "legal-systems",
    description:
      "BeautifulSoup4 scraper extracting Singapore court case data from the eLitigation portal.",
    tags: ["Python", "BeautifulSoup", "Legal Data"],
    github: "https://github.com/kevanwee/elitiscraper",
    external: null,
  },
  {
    title: "sg statute scraper",
    category: "legal-systems",
    description:
      "Scraper for Singapore Statutes Online (sso.agc.gov.sg) extracting legislative text for NLP pipelines. (WIP)",
    tags: ["Python", "BeautifulSoup", "Legal Data"],
    github: "https://github.com/kevanwee/sgstatutescraper",
    external: null,
  },
  {
    title: "hansard scraper",
    category: "legal-systems",
    description:
      "Parliamentary debate scraper extracting Singapore Hansard records for legislative history research. (WIP)",
    tags: ["Python", "BeautifulSoup", "Legal Data"],
    github: "https://github.com/kevanwee/hansardscraper",
    external: null,
  },
  {
    title: "tort rat",
    category: "legal-systems",
    description:
      "RAG-powered Discord chatbot for Singapore tort law using PostgresML and GPT-3.5 Turbo, deployed on AWS.",
    tags: ["Python", "RAG", "PostgresML", "AWS"],
    github: "https://github.com/kevanwee/tortrat",
    external: null,
  },
  {
    title: "sg-legal-corpus",
    category: "legal-systems",
    description: "Singapore legal sources as a point-in-time corpus, with provenance for each record.",
    tags: ["Python", "Legal data"],
    github: "https://github.com/kevanwee/sg-legal-corpus",
    external: null,
  },
  {
    title: "sg-deadline",
    category: "legal-systems",
    description: "Deterministic Singapore deadline calculations, with an explicit rule and a derivation trace.",
    tags: ["Python", "Rules as data"],
    github: "https://github.com/kevanwee/sg-deadline",
    external: null,
  },
  {
    title: "citecheck",
    category: "legal-systems",
    description: "Checks that cited authorities exist and support the propositions they are used for.",
    tags: ["Python", "Citations"],
    github: "https://github.com/kevanwee/citecheck",
    external: null,
  },
  {
    title: "chronology",
    category: "legal-systems",
    description: "Litigation chronologies with source pincites, preserved provenance and evidential-gap checks.",
    tags: ["Python", "Litigation"],
    github: "https://github.com/kevanwee/chronology",
    external: null,
  },
  {
    title: "oblig-register",
    category: "legal-systems",
    description: "Turns executed contracts into dated obligations registers and calendar reminders.",
    tags: ["Python", "Contracts"],
    github: "https://github.com/kevanwee/oblig-register",
    external: null,
  },
  {
    title: "ipatlas",
    category: "legal-systems",
    description: "Cross-border intellectual property protection as cited, versioned data.",
    tags: ["Python", "IP law"],
    github: "https://github.com/kevanwee/ipatlas",
    external: null,
  },
  {
    title: "pdpcscraper",
    category: "legal-systems",
    description: "Structured PDPC Protection Obligation decisions, penalties and trends.",
    tags: ["Python", "Legal data"],
    github: "https://github.com/kevanwee/pdpcscraper",
    external: null,
  },
  {
    title: "sg-legalresearch-skill",
    category: "agent-skills",
    description: "Singapore legal research and citation checking from primary sources, with evidence and version records.",
    tags: ["Agent skills", "Research"],
    github: "https://github.com/kevanwee/sg-legalresearch-skill",
    external: null,
  },
  {
    title: "legal-extraction-skill",
    category: "agent-skills",
    description: "Extracts document fields with every value bound to its exact source text and checked span.",
    tags: ["Agent skills", "Extraction"],
    github: "https://github.com/kevanwee/legal-extraction-skill",
    external: null,
  },
  {
    title: "Process modelling & runner",
    category: "agent-skills",
    description: "Models legal work as inspectable steps and runs released workflows with recorded state and human decision gates. Private source; described in the public guide.",
    tags: ["Process design", "Workflows"],
    github: null,
    external: "https://legal-engineering-manifesto.vercel.app/toolkit",
  },
  {
    title: "Singapore clause drafting",
    category: "agent-skills",
    description: "Drafts from supplied research and records the drafting rationale; approved clauses can be retained as precedents. Private source; described in the public guide.",
    tags: ["Agent skills", "Drafting"],
    github: null,
    external: "https://legal-engineering-manifesto.vercel.app/toolkit",
  },
  {
    title: "PDPA assessment",
    category: "agent-skills",
    description: "Assesses an activity obligation by obligation against retrieved provision text. Private source; described in the public guide.",
    tags: ["Agent skills", "Review"],
    github: null,
    external: "https://legal-engineering-manifesto.vercel.app/toolkit",
  },
];


export const projectGroups: { id: ProjectCategory; title: string; description: string }[] = [
  { id: "legal-systems", title: "Legal systems & data", description: "Source-backed tools, rules as data and legal information pipelines." },
  { id: "agent-skills", title: "Agent skills & workflows", description: "Reusable research, drafting and review capabilities. Scrum coordination is featured in Highlights above." },
  { id: "other-experiments", title: "Other experiments", description: "Tools and side projects beyond the legal toolkit." },
];

export const legalEngineering = {
  title: "Legal Engineering",
  manifestoTitle: "The Legal Engineering Manifesto",
  manifestoUrl: "https://legal-engineering-manifesto.vercel.app/",
  paragraphs: [
    "I see legal engineering taking shape around a practical question: how do we turn legal requirements into systems people can depend on? For me, that starts with understanding the work, its people and its decisions, before choosing what to automate.",
    "My interest is in connecting legal reasoning, process design and software delivery. The result should be inspectable, tested and maintainable, with people responsible for checking the evidence and making decisions. I'm developing that view through the skills and tools below, and in my Legal Engineering Manifesto."
  ],
};

export const portfolioSections = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "legal-engineering", label: "Legal Engineering" },
  { id: "projects", label: "Projects" },
  { id: "media", label: "Media" },
  { id: "contact", label: "Contact" },
];
