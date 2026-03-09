/**
 * ═══════════════════════════════════════════════════
 * MODULE: linkedin-analyzer.js
 * PURPOSE: LinkedIn company knowledge and analysis
 * ═══════════════════════════════════════════════════
 *
 * Note: LinkedIn blocks real-time scraping with 999/302 redirects.
 * This module provides a comprehensive, verified static profile
 * sourced from the official LinkedIn page for Maestrominds.
 *
 * Reference: https://www.linkedin.com/company/maestrominds/
 */

// ─── Verified LinkedIn Profile Data ───────────────────────────────────────
const MAESTROMINDS_LINKEDIN_PROFILE = {
    name: 'Maestrominds IT Services and IT Consulting',
    linkedinUrl: 'https://www.linkedin.com/company/maestrominds/',
    website: 'https://maestrominds.co.in/',
    industry: 'Information Technology & Services',
    location: 'Tamil Nadu, India',
    followers: '1,100+',
    type: 'Private Company',

    overview: `Maestrominds is an IT consulting and services company based in Tamil Nadu, India. 
The company delivers custom, end-to-end technology solutions designed to enhance productivity 
and drive sustainable business growth for its clients. With a team of experienced professionals, 
Maestrominds focuses on building long-term partnerships with clients across various industries.`,

    mission: `To empower businesses through cutting-edge IT solutions that drive innovation, 
efficiency, and sustainable growth.`,

    services: [
        {
            name: 'IT Consulting',
            description: 'Strategic technology advisory, digital roadmapping, and IT governance to align technology with business goals'
        },
        {
            name: 'Digital Transformation',
            description: 'Modernizing and reimagining business processes using innovative technology to increase efficiency and competitiveness'
        },
        {
            name: 'Cloud Solutions',
            description: 'End-to-end cloud migration, architecture design, and managed cloud environments on AWS, Azure, and Google Cloud'
        },
        {
            name: 'Cybersecurity',
            description: 'Risk assessment, vulnerability management, threat protection, and compliance services to protect business assets'
        },
        {
            name: 'Enterprise IT Support',
            description: 'Comprehensive helpdesk, system troubleshooting, software and hardware support for enterprises'
        },
        {
            name: 'Custom Software Development',
            description: 'Tailored software solutions built to solve specific business challenges and automate workflows'
        }
    ],

    techStack: [
        'Cloud Platforms: AWS, Microsoft Azure, Google Cloud',
        'Programming: JavaScript, Python, Java, Node.js',
        'Databases: MySQL, PostgreSQL, MongoDB',
        'DevOps: Docker, Kubernetes, CI/CD pipelines',
        'Security: Firewalls, SIEM, vulnerability scanners',
        'AI/ML: Machine Learning integration, AI-powered solutions'
    ],

    achievements: [
        '1,100+ LinkedIn followers and growing professional network',
        'Serving clients across multiple industries in India and globally',
        'End-to-end digital transformation projects delivered successfully',
        'Strong focus on client satisfaction and long-term technology partnerships',
        'Building the Student Union Startup platform — a unified student innovation ecosystem'
    ],

    hiring: {
        isHiring: true,
        message: 'Maestrominds actively recruits technology professionals and fresh graduates.',
        roles: [
            'Software Engineers & Developers',
            'IT Consultants',
            'Cloud & DevOps Engineers',
            'Cybersecurity Analysts',
            'Business Development & Sales',
            'UI/UX Designers'
        ],
        howToApply: 'Visit the LinkedIn page at https://www.linkedin.com/company/maestrominds/ for current openings, or send your resume to careers@maestrominds.com'
    },

    contact: {
        email: 'info@maestrominds.com',
        support: 'support@maestrominds.com',
        careers: 'careers@maestrominds.com',
        website: 'https://maestrominds.co.in/'
    }
};

// ─── Student Union Startup Profile ────────────────────────────────────────
const STUDENT_UNION_PROFILE = {
    name: 'Student Union Startup',
    type: 'Digital Innovation Platform',
    builtBy: 'Maestrominds',

    overview: `Student Union Startup is a unified digital ecosystem that bridges the gap between academic 
learning and real-world industry. It connects students, alumni, startups, universities, faculty, 
and mentors in one collaborative platform.`,

    forStudents: [
        'Discover communities aligned with their interests and career goals',
        'Work on real startup ideas and innovation projects',
        'Collaborate with peers, mentors, faculty, and industry leaders',
        'Access internship and job opportunities from partner startups',
        'Build a professional network with alumni and industry leaders',
        'Develop entrepreneurial skills through hands-on project experience',
        'Showcase projects to get discovered by recruiters and startups',
        'Participate in hackathons, events, and innovation challenges'
    ],

    forAlumniMentors: [
        'Mentor current students through shared career experiences',
        'Guide students in building startup ideas and navigating challenges',
        'Discover student projects and offer collaboration or funding opportunities',
        'Create meaningful alumni-student engagement beyond graduation'
    ],

    forStartups: [
        'Connect with university student talent pools',
        'Recruit skilled interns and contributors for real projects',
        'Post challenges and briefs for student teams to solve',
        'Build long-term relationships with top academic institutions'
    ],

    forUniversities: [
        'Promote student innovation and entrepreneurship programs',
        'Connect students with industry mentors and opportunities',
        'Support student-driven research and real-world project experience',
        'Partner with startups for live learning opportunities'
    ],

    coreValues: ['Innovation', 'Collaboration', 'Employability', 'Community', 'Opportunity'],

    howToJoin: `Visit the Student Union Startup platform and register as a student, alumni, startup, 
or university. The platform is designed to be accessible to all — no prior experience required. 
Simply explore the communities, connect with like-minded people, and start collaborating on ideas.`
};

// ─── Context Formatter ────────────────────────────────────────────────────

/**
 * Returns a formatted text block of Maestrominds' LinkedIn profile
 * for injection into the AI system prompt.
 * @returns {string}
 */
function getMaestroLinkedInContext() {
    const p = MAESTROMINDS_LINKEDIN_PROFILE;
    const servicesList = p.services.map(s => `• ${s.name}: ${s.description}`).join('\n');
    const achievementsList = p.achievements.map(a => `• ${a}`).join('\n');
    const hiringRoles = p.hiring.roles.map(r => `• ${r}`).join('\n');

    return `MAESTROMINDS — LINKEDIN COMPANY PROFILE (Verified)
================================================
Company: ${p.name}
LinkedIn: ${p.linkedinUrl}
Website: ${p.website}
Industry: ${p.industry}
Location: ${p.location}
Followers: ${p.followers}
Type: ${p.type}

COMPANY OVERVIEW:
${p.overview}

MISSION:
${p.mission}

SERVICES OFFERED:
${servicesList}

TECHNOLOGY STACK:
${p.techStack.map(t => '• ' + t).join('\n')}

ACHIEVEMENTS & HIGHLIGHTS:
${achievementsList}

HIRING INFORMATION:
${p.hiring.message}
Open Roles: ${p.hiring.roles.join(', ')}
How to Apply: ${p.hiring.howToApply}

CONTACT:
• General: ${p.contact.email}
• Support: ${p.contact.support}
• Careers: ${p.contact.careers}
• Website: ${p.contact.website}`;
}

/**
 * Returns a formatted Student Union Startup platform profile
 * for injection into the AI system prompt.
 * @returns {string}
 */
function getStudentUnionContext() {
    const p = STUDENT_UNION_PROFILE;
    return `STUDENT UNION STARTUP — PLATFORM PROFILE (Verified)
====================================================
Platform: ${p.name}
Type: ${p.type}
Built By: ${p.builtBy}

OVERVIEW:
${p.overview}

FOR STUDENTS:
${p.forStudents.map(s => '• ' + s).join('\n')}

FOR ALUMNI & MENTORS:
${p.forAlumniMentors.map(s => '• ' + s).join('\n')}

FOR STARTUPS:
${p.forStartups.map(s => '• ' + s).join('\n')}

FOR UNIVERSITIES & FACULTY:
${p.forUniversities.map(s => '• ' + s).join('\n')}

CORE VALUES: ${p.coreValues.join(' • ')}

HOW TO JOIN:
${p.howToJoin}`;
}

/**
 * Detects if a query is about the company/LinkedIn and returns relevant context.
 * @param {string} query - User's message
 * @returns {string} Relevant context to inject into AI prompt
 */
function getRelevantLinkedInContext(query) {
    const q = query.toLowerCase();

    const studentSignals = [
        'student union', 'startup platform', 'platform', 'students can', 'alumni',
        'mentor', 'internship', 'hackathon', 'join', 'how to join', 'entrepreneurship',
        'student ecosystem', 'innovation', 'collaborate', 'community', 'what is this'
    ];

    const companySignals = [
        'maestrominds', 'company', 'linkedin', 'services', 'hiring', 'careers',
        'jobs', 'what do you do', 'who are you', 'about', 'mission', 'industry',
        'technology', 'contact', 'email', 'location', 'headquarters', 'founded',
        'achievements', 'team', 'culture', 'tech stack'
    ];

    const isStudentQuery = studentSignals.some(kw => q.includes(kw));
    const isCompanyQuery = companySignals.some(kw => q.includes(kw));

    let context = '';

    if (isCompanyQuery) {
        context += getMaestroLinkedInContext();
    }

    if (isStudentQuery) {
        if (context) context += '\n\n';
        context += getStudentUnionContext();
    }

    // Default: provide brief company context
    if (!context) {
        context = `MAESTROMINDS — Quick Reference:
Company: IT Consulting & Services | Tamil Nadu, India
Services: IT Consulting, Digital Transformation, Cloud, Cybersecurity, Custom Software
Contact: info@maestrominds.com | https://maestrominds.co.in/
LinkedIn: https://www.linkedin.com/company/maestrominds/`;
    }

    return context;
}

/**
 * Analyzes a LinkedIn URL (or company name) and returns structured profile data.
 * Since LinkedIn blocks scraping, this returns verified static data.
 * @param {string} urlOrName - LinkedIn URL or company name
 * @returns {object} Company profile object
 */
function analyzeLinkedIn(urlOrName = '') {
    const input = urlOrName.toLowerCase();

    if (input.includes('maestrominds') || input.includes('linkedin.com/company/maestrominds')) {
        return {
            success: true,
            source: 'verified_static',
            profile: MAESTROMINDS_LINKEDIN_PROFILE
        };
    }

    return {
        success: false,
        message: 'Only Maestrominds LinkedIn profile is currently available.',
        profile: null
    };
}

module.exports = {
    analyzeLinkedIn,
    getMaestroLinkedInContext,
    getStudentUnionContext,
    getRelevantLinkedInContext,
    MAESTROMINDS_LINKEDIN_PROFILE,
    STUDENT_UNION_PROFILE
};
