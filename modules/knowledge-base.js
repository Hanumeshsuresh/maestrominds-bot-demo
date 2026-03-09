/**
 * ═══════════════════════════════════════════════════
 * MODULE: knowledge-base.js
 * PURPOSE: Office Q&A knowledge store + retrieval
 * ═══════════════════════════════════════════════════
 *
 * INTEGRATION POINT: Called by smart-responder.js to
 * enrich the system prompt with relevant office info.
 * Does NOT modify any existing HTML/CSS/JS code.
 */

/**
 * Predefined knowledge base for the office.
 * Each category has: keywords (for matching) and content (for the AI prompt).
 */
const KNOWLEDGE_BASE = {
    hours: {
        keywords: ['hour', 'time', 'open', 'close', 'schedule', 'timing', 'when', 'available', 'weekend', 'saturday', 'sunday', 'monday', 'office hour'],
        content: `
OFFICE HOURS:
- Monday to Friday: 9:00 AM – 5:00 PM
- Saturday: 10:00 AM – 2:00 PM
- Sunday: CLOSED
- Public Holidays: CLOSED
- Lunch break: 1:00 PM – 2:00 PM (limited service)
`
    },

    location: {
        keywords: ['location', 'address', 'where', 'find us', 'directions', 'floor', 'suite', 'building', 'reach', 'navigate', 'map', 'parking'],
        content: `
OFFICE LOCATION:
- Address: 123 Innovation Tower, Tech District, Suite 400
- Floor: 4th Floor, Innovation Tower
- Landmark: Opposite Central Metro Station
- Parking: Available on Basement Level B1 and B2 (first 2 hours free)
- Public Transport: Tech District Metro Station (2-minute walk)
- Elevator: Available from main lobby
`
    },

    services: {
        keywords: ['service', 'offer', 'provide', 'help', 'assist', 'what do you do', 'capabilities', 'expertise', 'solutions', 'project', 'consulting', 'training', 'support', 'it consulting', 'cloud', 'cybersecurity', 'digital transformation'],
        content: `
MAESTROMINDS SERVICES OFFERED:
1. IT Consulting — Strategic technology advisory and digital roadmapping
2. Digital Transformation — Modernizing business processes through innovative technology
3. Cloud Solutions — Migration, architecture, and managed cloud environments
4. Cybersecurity — Risk assessment, threat protection, and ensuring compliance
5. Enterprise IT Support — Helpdesk, system troubleshooting, software & hardware support
`
    },

    contact: {
        keywords: ['contact', 'email', 'phone', 'call', 'reach', 'get in touch', 'number', 'message', 'enquiry', 'inquiry'],
        content: `
CONTACT MAESTROMINDS:
- General Enquiries: info@maestrominds.com
- Phone: (555) 123-4567
- Technical Support: support@maestrominds.com
- HR / Careers: careers@maestrominds.com
- Fax: (555) 123-4568
- WhatsApp Business: +1 (555) 123-4567
`
    },

    departments: {
        keywords: ['department', 'division', 'team', 'unit', 'section', 'hr', 'finance', 'it', 'operations', 'marketing', 'admin', 'management'],
        content: `
DEPARTMENTS:
1. Administration & Reception — General inquiries, visitor management
2. Human Resources (HR) — Recruitment, employee welfare, policies
3. Finance & Accounts — Billing, invoicing, financial queries
4. Information Technology (IT) — Technical support, systems management
5. Operations — Day-to-day business operations, logistics
6. Marketing & Communications — Partnerships, media, promotions
7. Client Services — Customer relations, account management
8. Research & Development — Innovation, product development
`
    },

    appointment: {
        keywords: ['appointment', 'book', 'schedule', 'meeting', 'visit', 'slot', 'reserve', 'availability', 'calendar', 'session', 'consultation'],
        content: `
APPOINTMENT / BOOKING PROCESS:
- Walk-in visits: Welcome during office hours (may involve wait time)
- Pre-scheduled meetings: Recommended for consultations
- How to book:
  1. Email: info@maestrominds.com with preferred date/time
  2. Phone: (555) 123-4567 — speak to reception
  3. Online: Visit our website booking portal
- Response time: Within 1-2 business hours
- Cancellation: 24-hour advance notice required
- Virtual meetings: Available via Zoom / Google Meet
`
    },

    navigation: {
        keywords: ['website', 'navigate', 'page', 'portal', 'login', 'register', 'find', 'section', 'menu', 'link', 'online', 'web'],
        content: `
WEBSITE NAVIGATION HELP:
- Home Page: Overview of services and announcements
- Services: Detailed listing of all our service offerings
- About Us: Our story, mission, vision, and team
- Contact: Contact form, phone, email, and map
- Appointment Booking: Online booking portal
- Client Portal: Secure login for existing clients
- Career Opportunities: Current job openings
- FAQ: Frequently asked questions
- News & Updates: Latest office news and events
`
    },

    faq: {
        keywords: ['faq', 'frequently', 'common', 'question', 'general', 'policy', 'rule', 'dress code', 'id', 'identity', 'visitor'],
        content: `
FREQUENTLY ASKED QUESTIONS:
- Visitor ID: Government-issued photo ID required for entry
- Dress Code: Business casual or formal attire recommended
- Wi-Fi: Guest Wi-Fi available at reception (ask for password)
- Accessibility: Wheelchair accessible; elevators available
- Cafeteria: 2nd floor, open Monday–Friday 8 AM–4 PM
- Feedback: feedback@maestrominds.com or physical feedback box at reception
`
    },

    // ── Student Union Startup Platform Knowledge ──────────────────────────────
    platform_overview: {
        keywords: [
            'student union', 'startup platform', 'platform', 'what is this', 'about this',
            'student ecosystem', 'student startup', 'this website', 'this app', 'this platform',
            'student union startup', 'unified space', 'ecosystem', 'innovation platform'
        ],
        content: `
STUDENT UNION STARTUP — PLATFORM OVERVIEW:
The Student Union Startup platform is a unified digital ecosystem designed to connect students, alumni, startups, universities, faculty, and mentors in one place.

Purpose:
- To bridge the gap between academic learning and real-world industry exposure
- To foster innovation, entrepreneurship, and collaboration among students
- To create meaningful opportunities for students to grow professionally and academically

Who it's for:
- Students looking to discover startup opportunities and communities
- Alumni who want to mentor and guide the next generation
- Startups seeking university talent for internships and projects
- Universities and faculty promoting student-driven innovation
- Mentors who want to support student growth
`
    },

    platform_students: {
        keywords: [
            'student', 'students can', 'student opportunity', 'opportunities', 'collaborate',
            'startup idea', 'project', 'community', 'discover', 'student driven', 'intern',
            'internship', 'employability', 'career', 'skills', 'learn', 'grow'
        ],
        content: `
STUDENT OPPORTUNITIES ON THE PLATFORM:
Students can use the Student Union Startup platform to:
- Discover active communities aligned with their interests and goals
- Work on real startup ideas and innovation projects
- Collaborate with peers, faculty, and mentors on meaningful projects
- Access job and internship opportunities from partner startups
- Build their professional network with alumni and industry leaders
- Develop entrepreneurial skills through hands-on experience
- Showcase projects and get discovered by recruiters and startups
- Participate in hackathons, events, and innovation challenges
The platform promotes student employability and idea-driven entrepreneurship.
`
    },

    platform_alumni_mentors: {
        keywords: [
            'alumni', 'mentor', 'mentoring', 'guidance', 'career experience', 'share experience',
            'support students', 'guide', 'network', 'connect with alumni', 'mentorship'
        ],
        content: `
ALUMNI & MENTOR ROLE ON THE PLATFORM:
Alumni and mentors play a critical role in the Student Union Startup ecosystem:
- Alumni can register and mentor current students going through similar journeys
- They share real career experiences, industry insights, and professional advice
- Mentors guide students in developing startup ideas and navigating challenges
- Alumni can discover student projects and offer collaboration or funding opportunities
- The platform creates meaningful alumni-student engagement beyond graduation
`
    },

    platform_startups_universities: {
        keywords: [
            'startup', 'startups', 'university', 'universities', 'institution', 'faculty',
            'recruit', 'talent', 'contributor', 'university talent', 'partner', 'connect with',
            'collaboration', 'academic', 'industry', 'research'
        ],
        content: `
STARTUPS & UNIVERSITIES ON THE PLATFORM:
Startups:
- Can connect directly with university student talent pools
- Recruit skilled interns and contributors for real projects
- Offer project briefs and challenges to student teams
- Build long-term relationships with top academic institutions

Universities & Faculty:
- Can promote student innovation and entrepreneurship programs
- Enable faculty to connect students with industry mentors
- Support student-driven research and real-world project experience
- Partner with startups to create live learning opportunities for students

The platform promotes a thriving innovation ecosystem where academic and industry worlds merge.
`
    }
};

/**
 * Checks if a query appears to be office-related.
 * @param {string} message - User's message
 * @returns {boolean}
 */
function isOfficeRelated(message) {
    const lowerMsg = message.toLowerCase();

    // Collect all keywords from all categories
    const allKeywords = Object.values(KNOWLEDGE_BASE)
        .flatMap(cat => cat.keywords);

    // Office-specific terms always considered relevant
    const officeTerms = [
        'office', 'visit', 'staff', 'team', 'business', 'work', 'professional',
        'company', 'organization', 'corporate', 'reception', 'secretary', 'help me'
    ];

    const combined = [...allKeywords, ...officeTerms];
    return combined.some(kw => lowerMsg.includes(kw));
}

/**
 * Retrieves relevant knowledge sections based on the user's query.
 * Uses keyword matching across all categories.
 * @param {string} query - The user's latest message
 * @param {Array} [history] - Optional: recent conversation messages for context
 * @returns {string} Formatted knowledge context string for system prompt injection
 */
function getRelevantKnowledge(query, history = []) {
    const lowerQuery = query.toLowerCase();

    // Also scan recent history for context (last 3 turns)
    const recentText = history
        .slice(-3)
        .map(m => m.content || '')
        .join(' ')
        .toLowerCase();

    const combinedText = lowerQuery + ' ' + recentText;

    const matched = [];

    // Score each category by keyword match count
    for (const [category, data] of Object.entries(KNOWLEDGE_BASE)) {
        const matchCount = data.keywords.filter(kw => combinedText.includes(kw)).length;
        if (matchCount > 0) {
            matched.push({ category, content: data.content, score: matchCount });
        }
    }

    if (matched.length === 0) {
        // Return a brief general context if nothing specific matched
        return `
GENERAL MAESTROMINDS CONTEXT:
Firm: MAESTROMINDS - IT Consulting & Services
Contact: info@maestrominds.com | (555) 123-4567
Services: IT Consulting, Digital Transformation, Cloud Solutions, Cybersecurity, Enterprise IT Support
`;
    }

    // Sort by relevance score, take top 3 sections to avoid prompt bloat
    matched.sort((a, b) => b.score - a.score);
    const topSections = matched.slice(0, 3);

    return `\nRELEVANT OFFICE INFORMATION:\n` +
        topSections.map(m => m.content).join('\n---\n');
}

module.exports = { getRelevantKnowledge, isOfficeRelated, KNOWLEDGE_BASE };
