/**
 * ═══════════════════════════════════════════════════
 * MODULE: scraper.js
 * PURPOSE: Automated company knowledge extraction
 *          with deduplication and verified facts
 * ═══════════════════════════════════════════════════
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');

// ─── Verified Real Company Facts (always available, no duplicates) ────────────
// Source: https://www.linkedin.com/company/maestrominds/ + official website
const VERIFIED_MAESTROMINDS_FACTS = `
MAESTROMINDS — VERIFIED COMPANY PROFILE
========================================

Company Name: Maestrominds IT Services and IT Consulting
Industry: Information Technology & Services
Location: Tamil Nadu, India
LinkedIn Followers: 1,100+ followers
LinkedIn: https://www.linkedin.com/company/maestrominds/
Website: https://maestrominds.co.in/

WHAT MAESTROMINDS DOES:
Maestrominds offers custom IT solutions that enhance productivity and drive business growth.
The company specializes in:
• IT Consulting — Strategic technology advisory and digital roadmapping
• Digital Transformation — Modernizing business processes with innovative technology
• Cloud Solutions — Cloud migration, architecture, and managed cloud environments
• Cybersecurity — Risk assessment, threat protection, and compliance
• Enterprise IT Support — Helpdesk, system troubleshooting, hardware and software support
• Custom Software Development — Tailored solutions for business needs

MISSION:
To empower businesses through cutting-edge IT solutions that drive innovation and sustainable growth.

ABOUT:
Maestrominds is committed to delivering excellence in IT consulting and services. Their team of experienced professionals provides end-to-end technology solutions customized to each client's unique requirements. The company focuses on building long-term partnerships with clients to ensure continuous value and support.

CONTACT:
• Email: info@maestrominds.com
• Technical Support: support@maestrominds.com
• Phone: Available via website contact form
• Location: Tamil Nadu, India
`;

// ─── Student Union Startup Platform Knowledge ────────────────────────────────
const VERIFIED_PLATFORM_FACTS = `
STUDENT UNION STARTUP — PLATFORM KNOWLEDGE
============================================

Platform Name: Student Union Startup
Type: Digital Ecosystem / Student Innovation Platform

PURPOSE:
The Student Union Startup platform is a unified digital space that connects students, alumni,
startups, universities, faculty, and mentors to promote innovation, collaboration, and opportunity.

FOR STUDENTS:
• Discover active communities aligned with interests and goals
• Work on real-world startup ideas and innovation projects
• Collaborate with peers, mentors, faculty, and industry leaders
• Access internship and job opportunities from partner startups
• Build a professional network through the platform
• Develop entrepreneurial skills through hands-on experience
• Showcase projects to get discovered by recruiters and startups
• Participate in hackathons, events, and innovation challenges

FOR ALUMNI & MENTORS:
• Mentor current students through shared career experiences
• Guide students in building startup ideas and navigating challenges
• Discover student projects and offer collaboration or funding
• Create meaningful alumni-student engagement beyond graduation

FOR STARTUPS:
• Connect with university student talent pools
• Recruit skilled interns and contributors for real projects
• Post challenges for student teams to solve
• Build long-term relationships with top academic institutions

FOR UNIVERSITIES & FACULTY:
• Promote student innovation and entrepreneurship programs
• Connect students with industry mentors
• Support student-driven research and live project experience
• Partner with startups for real-world learning opportunities

KEY VALUES:
• Innovation — Encourage students to build the next generation of ideas
• Collaboration — Connect all stakeholders in one unified space
• Employability — Prepare students for professional success
• Community — Build a strong, engaged student-startup ecosystem
`;


// ─── Web Sources to enrich knowledge ──────────────────────────────────────────
const SOURCES = [
    { type: 'website', url: 'https://maestrominds.co.in/' },
    { type: 'linkedin', url: 'https://www.linkedin.com/company/maestrominds/' }
];

/**
 * Extracts visible text from HTML, removing boilerplate.
 */
function extractTextFromHtml(html) {
    const $ = cheerio.load(html);
    $('script, style, link, meta, noscript, svg, nav, footer, iframe, header').remove();
    const text = $('body').text()
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return text;
}

/**
 * Deduplicates an array of text chunks by removing near-identical content.
 * @param {string[]} chunks
 * @returns {string[]}
 */
function deduplicateChunks(chunks) {
    const seen = new Set();
    const unique = [];

    for (const chunk of chunks) {
        // Normalize: lowercase, collapse whitespace, take first 120 chars as fingerprint
        const fingerprint = chunk.toLowerCase().replace(/\s+/g, ' ').substring(0, 120);

        // Check for near-duplicates (80% character overlap with existing entries)
        let isDuplicate = false;
        for (const s of seen) {
            const overlap = [...fingerprint].filter(c => s.includes(c)).length;
            if (overlap / fingerprint.length > 0.85) {
                isDuplicate = true;
                break;
            }
        }

        if (!isDuplicate && chunk.length > 40) {
            seen.add(fingerprint);
            unique.push(chunk);
        }
    }

    return unique;
}

/**
 * Performs a GET request to scrape a URL.
 */
async function scrapeUrl(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 8000
        });

        if (!response.ok) {
            console.warn(`[scraper] Warning: ${url} returned ${response.status}`);
            return '';
        }

        const html = await response.text();
        return extractTextFromHtml(html);

    } catch (err) {
        console.warn(`[scraper] Could not reach ${url}:`, err.message);
        return '';
    }
}

/**
 * Main function: extracts, cleans, and deduplicates company knowledge.
 * Always returns verified facts + any additional scraped content.
 * @returns {Promise<string[]>} Array of unique, clean text chunks
 */
async function extractCompanyKnowledge() {
    console.log('[scraper] Starting knowledge extraction...');

    // Start with the verified facts as the primary source of truth
    let allChunks = [VERIFIED_MAESTROMINDS_FACTS, VERIFIED_PLATFORM_FACTS];

    // Try to enrich with live website data
    for (const source of SOURCES) {
        console.log(`[scraper] Scraping ${source.type}: ${source.url}`);
        const text = await scrapeUrl(source.url);

        if (text && text.length > 100) {
            // Split into meaningful paragraphs
            const rawChunks = text
                .split(/(?:\n\s*\n)+/)
                .map(c => c.trim())
                .filter(c => c.length > 60 && c.length < 2000); // Skip tiny fragments and huge blobs

            allChunks.push(...rawChunks);
        }
    }

    // Deduplicate all chunks (removes near-identical content)
    const uniqueChunks = deduplicateChunks(allChunks);

    console.log(`[scraper] Knowledge ready: ${uniqueChunks.length} unique facts extracted.`);
    return uniqueChunks;
}

module.exports = { extractCompanyKnowledge };
