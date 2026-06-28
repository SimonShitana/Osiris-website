/**
 * Osiris site configuration
 */
const OSIRIS_PLACEHOLDER_AVATAR = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect fill="#1e293b" width="120" height="120"/><circle cx="60" cy="44" r="22" fill="#475569"/><ellipse cx="60" cy="98" rx="36" ry="28" fill="#475569"/></svg>'
);

const OSIRIS_CONFIG = {
    siteName: 'Modulus',
    assets: {
        logo: 'assets/modulus_logo_tr.png',
        defaultAvatar: OSIRIS_PLACEHOLDER_AVATAR,
        channelAvatar: OSIRIS_PLACEHOLDER_AVATAR,
        heroImage: 'resources/files/mechanical-engineering.jpg',
        motivationQuote: 'resources/files/motivation-quote.jpg',
        careerArticle: 'resources/files/career-transferable-skills.jpg'
    },
    admin: {
        username: 'Stjohns',
        password: 'Stjohns@26th',
        email: 'simonshitana21@gmail.com'
    },
    peerEducation: {
        email: 'unescopeereducators@gmail.com',
        label: 'UNESCO Peer Educators'
    },

    founder: {
        name: 'Simon Shitana',
        email: 'simonshitana21@gmail.com',
        phone: '0817687816',
        program: 'Mechanical Engineering',
        startYear: 2024,
        undergradYears: 5,
        referenceYear: 2026,
        referenceYearOfStudy: 3,
        intro: 'Simon Shitana is the founder and sole administrator of Modulus — a mechanical engineering student, developer, and educator building a platform where students share resources, support each other, and grow together.'
    },

    channelCategories: ['leadership', 'wellness', 'engineering', 'motivation'],
    googleForms: {
        main: 'https://docs.google.com/forms/d/e/1FAIpQLScXAFrCG1seW42CMP0XP2TFQYrTzz4Ul-GtONYjSJe6CR3Quw/viewform?usp=publish-editor',
        volunteer: 'https://docs.google.com/forms/d/e/1FAIpQLScXAFrCG1seW42CMP0XP2TFQYrTzz4Ul-GtONYjSJe6CR3Quw/viewform?usp=publish-editor',
        mentor: 'https://docs.google.com/forms/d/e/1FAIpQLScXAFrCG1seW42CMP0XP2TFQYrTzz4Ul-GtONYjSJe6CR3Quw/viewform?usp=publish-editor',
        mentee: 'https://docs.google.com/forms/d/e/1FAIpQLScXAFrCG1seW42CMP0XP2TFQYrTzz4Ul-GtONYjSJe6CR3Quw/viewform?usp=publish-editor',
        feedback: 'https://docs.google.com/forms/d/e/1FAIpQLScXAFrCG1seW42CMP0XP2TFQYrTzz4Ul-GtONYjSJe6CR3Quw/viewform?usp=publish-editor',
        newsletter: 'https://docs.google.com/forms/d/e/1FAIpQLScXAFrCG1seW42CMP0XP2TFQYrTzz4Ul-GtONYjSJe6CR3Quw/viewform?usp=publish-editor'
    },
    ai: {
        /** Deploy Cloud Function — never put API keys in frontend code */
        endpoint: ''
    },
    impactMetrics: {
        studentsMentored: 500,
        workshopsHeld: 48,
        resourcesShared: 320,
        peerEducators: 36,
        clubsActive: 12
    },
    /** Static files per module folder — add PDFs under resources/pdfs/<slug>/ */
    moduleResources: {
        'Engineering Mechanics I': [
            {
                id: 'mech-guide',
                title: 'Engineering Mechanics Study Guide',
                type: 'Guide',
                file: 'resources/pdfs/engineering-mechanics-guide.pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            },
            {
                id: 'mech-papers',
                title: 'Engineering Mechanics Past Papers',
                type: 'Past Paper',
                file: 'resources/pdfs/mechanics-past-papers.pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            }
        ],
        'Engineering Mechanics II': [
            { id: 'mech2-ch1', title: 'Mechanics 2 — Chapter 1', type: 'Notes', file: 'resources/pdfs/mechanics-2/Chapter1.PDF' },
            { id: 'mech2-ch2', title: 'Mechanics 2 — Chapter 2', type: 'Notes', file: 'resources/pdfs/mechanics-2/Chapter2.PDF' },
            { id: 'mech2-ch3', title: 'Mechanics 2 — Chapter 3', type: 'Notes', file: 'resources/pdfs/mechanics-2/Chapter3.PDF' },
            { id: 'mech2-ch4', title: 'Mechanics 2 — Chapter 4', type: 'Notes', file: 'resources/pdfs/mechanics-2/Chapter4.PDF' },
            { id: 'mech2-ch5', title: 'Mechanics 2 — Chapter 5', type: 'Notes', file: 'resources/pdfs/mechanics-2/Chapter5.PDF' },
            { id: 'mech2-ch6', title: 'Mechanics 2 — Chapter 6', type: 'Notes', file: 'resources/pdfs/mechanics-2/Chapter6.PDF' }
        ],
        'Fluid Mechanics I': [
            {
                id: 'fluid-formulas',
                title: 'Fluid Mechanics Formula Sheet',
                type: 'Guide',
                file: 'resources/pdfs/fluid-mechanics-formulas.pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            },
            {
                id: 'fluid-midterm',
                title: 'Fluid Mechanics Midterm + Solutions',
                type: 'Past Paper',
                file: 'resources/pdfs/fluid-mechanics-midterm.pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            }
        ],
        'Materials Science': [
            {
                id: 'materials-ref',
                title: 'Materials Science Quick Reference',
                type: 'Guide',
                file: 'resources/pdfs/materials-science-ref.pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            },
            {
                id: 'materials-bank',
                title: 'Materials Science Question Bank',
                type: 'Past Paper',
                file: 'resources/pdfs/materials-question-bank.pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            }
        ],
        'Math for Engineers': [
            {
                id: 'mfe-guide',
                title: 'Math for Engineers — 1 Study guide',
                type: 'Guide',
                file: 'resources/pdfs/Math for Engineers/1 Study guide.pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            },
            {
                id: 'mfe-ch1',
                title: 'Math for Engineers — Chapter 1 (Functions)',
                type: 'Notes',
                file: 'resources/pdfs/Math for Engineers/Chapter 1 (Functions).pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            },
            {
                id: 'mfe-ch2',
                title: 'Math for Engineers — Chapter 2 (Differentition)',
                type: 'Notes',
                file: 'resources/pdfs/Math for Engineers/Chapter 2 (Differentition).pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            },
            {
                id: 'mfe-ch3',
                title: 'Math for Engineers — Chapter 3 (Integration)',
                type: 'Notes',
                file: 'resources/pdfs/Math for Engineers/Chapter 3 (Integration).pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            },
            {
                id: 'mfe-ch4',
                title: 'Math for Engineers — Chapter 4 (Sequences and Series of Numbers)',
                type: 'Notes',
                file: 'resources/pdfs/Math for Engineers/Chapter 4 (Sequences and Series of Numbers).pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            },
            {
                id: 'mfe-ch5',
                title: 'Math for Engineers — Chapter 5 (Polar Coordinates)',
                type: 'Notes',
                file: 'resources/pdfs/Math for Engineers/Chapter 5 (Polar Coordinates).pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            },
            {
                id: 'mfe-ch6',
                title: 'Math for Engineers — Chapter 6 (Lines & Planes)',
                type: 'Notes',
                file: 'resources/pdfs/Math for Engineers/Chapter 6 (Lines & Planes).pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            },
            {
                id: 'mfe-ch7',
                title: 'Math for Engineers — Chapter 7 (Systems of Linear Equations)',
                type: 'Notes',
                file: 'resources/pdfs/Math for Engineers/Chapter 7 (Systems of Linear Equations).pdf',
                demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
            }
        ]
    },

    /** Static music tracks — place files in resources/music/ */
    musicTracks: [{ id: 'music-readme', title: 'Add your .mp3 files to resources/music/', artist: 'Modulus', file: '' }],

    pdfResources: [
        { id: 'mech-guide-tab', title: 'Engineering Mechanics Study Guide', category: 'guides', file: 'resources/pdfs/engineering-mechanics-guide.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'thermo-notes', title: 'Thermodynamics Revision Notes', category: 'guides', file: 'resources/pdfs/thermodynamics-notes.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'fluid-formulas', title: 'Fluid Mechanics Formula Sheet', category: 'guides', file: 'resources/pdfs/fluid-mechanics-formulas.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'materials-ref', title: 'Materials Science Quick Reference', category: 'guides', file: 'resources/pdfs/materials-science-ref.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'python-ebook', title: 'Python for Engineers', category: 'ebooks', file: 'resources/pdfs/python-for-engineers.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'matlab-ebook', title: 'MATLAB Fundamentals e-Book', category: 'ebooks', file: 'resources/pdfs/matlab-fundamentals.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'cad-ebook', title: 'CAD Design Principles', category: 'ebooks', file: 'resources/pdfs/cad-design.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'study-planner', title: 'Study Planner Toolkit', category: 'toolkits', file: 'resources/pdfs/study-planner.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'mentor-handbook', title: 'Mentor Handbook', category: 'toolkits', file: 'resources/pdfs/mentor-handbook.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'thermo-exam-2023', title: 'Thermodynamics Final Exam 2023', category: 'papers', file: 'resources/pdfs/thermodynamics-exam-2023.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'fluid-midterm-tab', title: 'Fluid Mechanics Midterm + Solutions', category: 'papers', file: 'resources/pdfs/fluid-mechanics-midterm.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'materials-bank-tab', title: 'Materials Science Question Bank', category: 'papers', file: 'resources/pdfs/materials-question-bank.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
        { id: 'mech-papers-tab', title: 'Engineering Mechanics Past Papers', category: 'papers', file: 'resources/pdfs/mechanics-past-papers.pdf', demo: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' }
    ],

    codingProjects: [
        { id: 'p1', title: 'Modulus Platform', tag: 'Full-Stack', stack: 'HTML · CSS · JavaScript · Firebase', status: 'Live', description: 'Personal educational platform with auth, resources, AI assistant, and student hub.' },
        { id: 'p2', title: 'MATLAB Simulation Suite', tag: 'Engineering', stack: 'MATLAB · Simulink', status: 'In Progress', description: 'Placeholder — dynamics and control simulations for mechanical systems coursework.' },
        { id: 'p3', title: 'Peer Education Portal', tag: 'Web App', stack: 'JavaScript · Firestore', status: 'Planned', description: 'Placeholder — mentor matching and workshop scheduling for peer educators.' },
        { id: 'p4', title: 'CAD Automation Toolkit', tag: 'Design', stack: 'AutoCAD · Python', status: 'Planned', description: 'Placeholder — batch drawing utilities and template generators for design projects.' },
        { id: 'p5', title: 'Study Resource Index', tag: 'Open Source', stack: 'Node.js · PDF.js', status: 'Planned', description: 'Placeholder — searchable index of past papers and notes with tagging.' },
        { id: 'p6', title: 'Study Room Hub', tag: 'Web App', stack: 'JavaScript · PDF.js', status: 'Live', description: 'Integrated study space with music, tasks, motivation, and PDF viewer.' }
    ],

    motivationalQuotes: [
        { text: 'The future belongs to those who learn, build, and share.', author: 'Modulus' },
        { text: 'Excellence is not a destination — it is a continuous journey.', author: 'Simon Shitana' },
        { text: 'Engineering humanity forward, one student at a time.', author: 'Modulus Agent' },
        { text: 'Your struggle today becomes someone else\'s shortcut tomorrow.', author: 'Modulus Peer Education' },
        { text: 'Unity in learning. Strength in collaboration.', author: 'Modulus' }
    ]
};

function getOrdinal(n) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function getAcademicStatus(year) {
    const currentYear = year ?? new Date().getFullYear();
    const { program, undergradYears, referenceYear, referenceYearOfStudy } = OSIRIS_CONFIG.founder;
    const yearOfStudy = referenceYearOfStudy + (currentYear - referenceYear);
    if (yearOfStudy < 1) return `Preparing to begin ${program}`;
    if (yearOfStudy <= undergradYears) return `${getOrdinal(yearOfStudy)} year ${program} student`;
    return `${program} graduate · Modulus founder`;
}

function getGraduationTimeline() {
    const { startYear, undergradYears, program } = OSIRIS_CONFIG.founder;
    const undergradEnd = startYear + undergradYears - 1;
    return { undergradEnd, label: `BEng ${program} · Class of ${undergradEnd}` };
}

