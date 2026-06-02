import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

// Premium local AI simulation engine in case real AI credentials are not provided
function compileLocalAIResource(title: string, subjectName: string, batchName: string, type: string, topic: string) {
  const isMath = /math/i.test(topic + " " + subjectName);
  const isPhysics = /physic/i.test(topic + " " + subjectName);
  const isChemistry = /chem/i.test(topic + " " + subjectName);
  
  let primaryUrl = "https://ncert.nic.in/textbook.php";
  let primaryUrlTitle = "NCERT Official Textbook Portal";
  let primaryUrlDescription = "Official government publication website offering access to complete digital textbooks and materials.";
  
  let sites = [
    {
      url: "https://ncert.nic.in/textbook.php",
      title: "NCERT Official Textbook Portal",
      category: "Official Textbook PDFs",
      description: "Direct download links for official grade-specific textbooks across all subjects."
    },
    {
      url: "https://www.khanacademy.org",
      title: "Khan Academy Interactive Lessons",
      category: "Online Video Courses",
      description: "Free online courses, lessons, and practice worksheets with instant progress tracking."
    },
    {
      url: "https://openstax.org",
      title: "OpenStax College Textbooks",
      category: "Peer-Reviewed Textbooks",
      description: "High-quality, peer-reviewed textbook library for secondary and higher education."
    }
  ];

  if (isMath) {
    primaryUrl = "https://ncert.nic.in/textbook.php?emmh1=0-14";
    primaryUrlTitle = "NCERT Class 12 Mathematics Textbook Portal";
    primaryUrlDescription = "Direct access to official NCERT Class 12 mathematics textbook parts and chapters.";
    sites = [
      {
        url: "https://ncert.nic.in/textbook.php?emmh1=0-14",
        title: "NCERT Class 12 Mathematics Textbook Portal",
        category: "Official Textbook PDFs",
        description: "Official NCERT Class 12 Math digital textbook download link by chapters."
      },
      {
        url: "https://www.khanacademy.org/math/class-12-in-in",
        title: "Khan Academy Class 12 Mathematics",
        category: "Interactive Practice",
        description: "Structured video lectures and practice questions aligned with the high school curriculum."
      },
      {
        url: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-maths",
        title: "Vedantu Class 12 Maths Solutions & Revision Notes",
        category: "Study Notes",
        description: "Free solved revision exercises, formula cheat sheets, and topic breakdown guides."
      }
    ];
  } else if (isPhysics) {
    primaryUrl = "https://ncert.nic.in/textbook.php?eph1=0-8";
    primaryUrlTitle = "NCERT Class 12 Physics Textbook Portal";
    primaryUrlDescription = "Direct access to official NCERT Class 12 physics textbook chapters.";
    sites = [
      {
        url: "https://ncert.nic.in/textbook.php?eph1=0-8",
        title: "NCERT Class 12 Physics Textbook Portal",
        category: "Official Textbook PDFs",
        description: "Official NCERT Class 12 Physics digital textbook download link by chapters."
      },
      {
        url: "https://www.khanacademy.org/science/in-in-class12-physics",
        title: "Khan Academy Class 12 Physics",
        category: "Interactive Practice",
        description: "Exhaustive lectures covering mechanics, electricity, magnetism, and wave optics."
      },
      {
        url: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-physics",
        title: "Vedantu Class 12 Physics revision notes",
        category: "Revision Guides",
        description: "Chapter-wise formula sheets, core derivations, and solved textbook exercises."
      }
    ];
  } else if (isChemistry) {
    primaryUrl = "https://ncert.nic.in/textbook.php?ech1=0-9";
    primaryUrlTitle = "NCERT Class 12 Chemistry Textbook Portal";
    primaryUrlDescription = "Direct access to official NCERT Class 12 chemistry textbook chapters.";
    sites = [
      {
        url: "https://ncert.nic.in/textbook.php?ech1=0-9",
        title: "NCERT Class 12 Chemistry Textbook Portal",
        category: "Official Textbook PDFs",
        description: "Official NCERT Class 12 Chemistry digital textbook download link by chapters."
      },
      {
        url: "https://www.khanacademy.org/science/class-12-chemistry",
        title: "Khan Academy Class 12 Chemistry",
        category: "Interactive Practice",
        description: "Exhaustive video lectures covering solution states, kinetics, organic compounds, and polymers."
      },
      {
        url: "https://www.vedantu.com/ncert-solutions/ncert-solutions-class-12-chemistry",
        title: "Vedantu Class 12 Chemistry Revision Notes",
        category: "Revision Guides",
        description: "Core chemistry formulas, step-by-step chemical equations, and organic reactions."
      }
    ];
  }

  const markdownSummary = `# Curated Online Resources: ${title}
**Subject:** ${subjectName} | **Target Batch:** ${batchName}
**Category:** Web Resources Directory

We have compiled a premium directory of direct online websites, reference textbooks, and official portals satisfying your topic description: *"**${topic}**"*.

---

## 🌟 Primary Recommended Resource
### [${primaryUrlTitle}](${primaryUrl})
* **Resource Focus:** ${primaryUrlDescription}
* **Direct Access Link:** [Click here to open ${primaryUrlTitle}](${primaryUrl})

---

## 📚 Recommended Reference Websites

${sites.map((s, idx) => `### ${idx + 1}. [${s.title}](${s.url})
* **Resource Category:** ${s.category}
* **Description:** ${s.description}
* **Link:** [Open ${s.title} in a new tab](${s.url})`).join("\n\n")}

---
*Generated via TuitionPro local academic web compilation engine.*`;

  return JSON.stringify({
    primaryUrl,
    primaryUrlTitle,
    primaryUrlDescription,
    allFoundWebsites: sites,
    markdownSummary
  });
}

function convertMarkdownToPDF(markdown: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const fontRegular = path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf");
      const fontBold = path.join(process.cwd(), "public", "fonts", "Roboto-Bold.ttf");
      const fontItalic = path.join(process.cwd(), "public", "fonts", "Roboto-Italic.ttf");

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true,
        font: fontRegular // Set default font directly to Roboto to completely bypass Helvetica AFM bundle lookups!
      });

      // Register clean, local true type fonts to prevent Next.js ENOENT Helvetica.afm bundle errors!
      doc.registerFont("Roboto", fontRegular);
      doc.registerFont("Roboto-Bold", fontBold);
      doc.registerFont("Roboto-Italic", fontItalic);

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      doc.info["Title"] = "TuitionPro AI Study Material";
      doc.info["Author"] = "TuitionPro AI Engine";

      const lines = markdown.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === "") {
          doc.moveDown(0.4);
          continue;
        }

        // Headings
        if (line.startsWith("# ")) {
          doc.font("Roboto-Bold").fontSize(20).fillColor("#1e1b4b");
          doc.text(line.substring(2));
          doc.moveDown(0.5);
          continue;
        }
        if (line.startsWith("## ")) {
          doc.font("Roboto-Bold").fontSize(15).fillColor("#312e81");
          doc.text(line.substring(3));
          doc.moveDown(0.4);
          continue;
        }
        if (line.startsWith("### ")) {
          doc.font("Roboto-Bold").fontSize(12).fillColor("#4338ca");
          doc.text(line.substring(4));
          doc.moveDown(0.3);
          continue;
        }

        // Blockquotes / Notes
        if (line.startsWith(">")) {
          let quoteText = line.substring(1).trim();
          if (quoteText.startsWith("[!NOTE]")) {
            quoteText = quoteText.substring(7).trim();
          }
          
          doc.moveDown(0.1);
          const yBefore = doc.y;
          doc.font("Roboto-Italic").fontSize(10).fillColor("#475569");
          doc.text(quoteText, { indent: 15, width: 450 });
          const yAfter = doc.y;
          
          doc.lineWidth(3).strokeColor("#6366f1").moveTo(55, yBefore - 2).lineTo(55, yAfter + 2).stroke();
          doc.moveDown(0.3);
          continue;
        }

        // Bullet Lists
        if (line.startsWith("* ") || line.startsWith("- ")) {
          doc.font("Roboto").fontSize(10.5).fillColor("#1e293b");
          doc.text(`•  ${line.substring(2)}`, { indent: 15 });
          doc.moveDown(0.2);
          continue;
        }

        // Horizontal Rules
        if (line === "---") {
          doc.moveDown(0.2);
          doc.lineWidth(1).strokeColor("#e2e8f0").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
          doc.moveDown(0.4);
          continue;
        }

        // Standard Paragraphs
        const cleanLine = line.replace(/\*\*/g, ""); // Strip markdown bold tags
        doc.font("Roboto").fontSize(10.5).fillColor("#1e293b");
        doc.text(cleanLine, { align: "justify", lineGap: 2 });
        doc.moveDown(0.35);
      }

      // Add automatic page numbers and branding in a premium footer
      const pages = doc.bufferedPageRange();
      for (let j = 0; j < pages.count; j++) {
        doc.switchToPage(j);
        doc.font("Roboto").fontSize(8).fillColor("#94a3b8");
        doc.text(
          `Page ${j + 1} of ${pages.count}  |  Compiled Securely by TuitionPro AI Scraper Engine`,
          50,
          doc.page.height - 40,
          { align: "center", width: doc.page.width - 100 }
        );
      }

      doc.end();

      writeStream.on("finish", () => {
        resolve();
      });
      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function performLiveWebSearchAndScrape(topic: string, subjectName: string): Promise<string> {
  const searchQuery = `${topic} ${subjectName} textbook notes study material`;
  console.log("Performing live web search and crawl for:", searchQuery);
  
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!searchRes.ok) {
      console.log("Search scraper returned status:", searchRes.status);
      return "";
    }

    const html = await searchRes.text();
    const urls: string[] = [];
    
    // Scrape redirect links from DuckDuckGo HTML results
    const redirectRegex = /href="([^"]*uddg=[^"]*)"/g;
    let match;
    while ((match = redirectRegex.exec(html)) !== null && urls.length < 3) {
      const href = match[1];
      const uddgMatch = /uddg=([^&"]+)/.exec(href);
      if (uddgMatch) {
        const decodedUrl = decodeURIComponent(uddgMatch[1]);
        if (!decodedUrl.includes("duckduckgo.com") && !urls.includes(decodedUrl)) {
          urls.push(decodedUrl);
        }
      }
    }

    // Fallback standard URL parser
    if (urls.length === 0) {
      const simpleRegex = /class="result__url"[^>]*href="([^"]+)"/g;
      while ((match = simpleRegex.exec(html)) !== null && urls.length < 3) {
        const decodedUrl = decodeURIComponent(match[1]);
        if (!decodedUrl.includes("duckduckgo.com") && !urls.includes(decodedUrl)) {
          urls.push(decodedUrl);
        }
      }
    }

    console.log("Found top search result URLs to scrape live:", urls);
    if (urls.length === 0) return "";

    const scrapedContents: string[] = [];

    for (const url of urls) {
      try {
        console.log("Scraping live page content:", url);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s scrape timeout

        const pageRes = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (pageRes.ok) {
          let text = await pageRes.text();
          // Extract title if present
          const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/gi.exec(text);
          const pageTitle = titleMatch ? titleMatch[1].trim() : "Reference Portal";

          // Strip heavy styling, scripts, and format the text
          text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
          text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
          text = text.replace(/<[^>]*>/g, " ");
          text = text.replace(/\s+/g, " ").trim();
          
          if (text.length > 150) {
            scrapedContents.push(`### Source: ${pageTitle} (${url})\n${text.substring(0, 2500)}...`);
          }
        }
      } catch (err) {
        console.error(`Failed to scrape live page ${url}:`, err);
      }
    }

    return scrapedContents.join("\n\n=========================================\n\n");
  } catch (searchError) {
    console.error("Live Web Search/Crawler Error:", searchError);
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim() || null;
    const subjectId = String(body.subjectId ?? "").trim() || null;
    const batchId = String(body.batchId ?? "").trim() || null;
    const resourceType = String(body.resourceType ?? "").trim();
    const accessLevel = String(body.accessLevel ?? "PUBLIC");
    const topic = String(body.topic ?? "").trim();

    if (!title || !resourceType || !topic) {
      return NextResponse.json({ error: "Title, Resource Type, and Topic Description are required." }, { status: 400 });
    }

    // Resolve subject and batch names for premium metadata compilation
    let subjectName = "General";
    if (subjectId) {
      const subjectObj = await prisma.subject.findUnique({ where: { id: subjectId }, select: { name: true } });
      if (subjectObj) subjectName = subjectObj.name;
    }

    let batchName = "All Batches";
    if (batchId) {
      const batchObj = await prisma.batch.findUnique({ where: { id: batchId }, select: { name: true } });
      if (batchObj) batchName = batchObj.name;
    }

    // Execute live web crawl and scraping!
    const scrapedWebContent = await performLiveWebSearchAndScrape(topic, subjectName);

    let generatedContent = "";
    let isRealAI = false;

    // Check if we should call the real Google Gemini API from server environment (.env)
    const activeApiKey = process.env.GEMINI_API_KEY;
    const isApiKeyValid = activeApiKey && activeApiKey.trim() !== "" && activeApiKey !== "your-gemini-api-key-here";

    if (isApiKeyValid) {
      try {
        // Construct the prompt. If scraped content exists, instruct the model to ground solely in it!
        let textPrompt = "";
        
        if (scrapedWebContent) {
          textPrompt = `You are an elite academic compiler, librarian, and research assistant. We have performed a live internet search for the student/teacher request, crawled the web, and scraped the actual contents of the top reference web pages.
          
Below is the ACTUAL text content scraped from real study websites, textbook repositories, and online portals:
=========================================
${scrapedWebContent}
=========================================

Title: ${title}
Subject: ${subjectName}
Topic Description / Requirements: ${topic}
Resource Type: ${resourceType}

Your Core Objective:
1. Analyze the scraped live web pages and find the single most direct, authoritative, and useful external website URL or online PDF link (e.g. the official textbook site, a specific Khan Academy page, NCERT syllabus, open textbook link, etc.) that satisfies the user's specific request. This will be the "primaryUrl".
2. If the user asks for a textbook, reference guide, or practice sheet, search for direct download links or official viewing portals within the crawled URLs.
3. If no direct link is available in the scraped content, find the most authoritative general domain crawled (e.g. khanacademy.org, ncert.nic.in, openstax.org) that covers the subject.
4. Compile a curated directory listing of other highly relevant recommended websites with their names, direct links, and a professional review/description.
5. Create a beautifully formatted Markdown report summarizing all found websites, including bullet points, categories, clickable absolute links, and description.

You MUST return your response as a valid JSON object matching the following structure:
{
  "primaryUrl": "The direct absolute URL (starting with http:// or https://) of the most relevant website found in the search results that meets the user request",
  "primaryUrlTitle": "A professional name for this primary resource (e.g., NCERT Grade 12 Math Textbook)",
  "primaryUrlDescription": "A concise 1-2 sentence review of what this primary website provides and why it is the best match.",
  "allFoundWebsites": [
    {
      "url": "https://...",
      "title": "Title of the website",
      "category": "e.g., PDF Textbook, Interactive Courses, Lecture Videos, Practice Worksheets",
      "description": "A short, professional description of the website content and how it helps the student."
    }
  ],
  "markdownSummary": "# Curated Web Resources: [Title]\\n\\nWrite a beautifully structured, comprehensive, and exhaustive study directory in Markdown. Include headers, structured sections, bullet points, and clickable markdown links ([Link Text](URL)) for all recommended websites. Explain clearly what each site contains. Keep it premium, professional, and directly useful for exams and teaching."
}

Do NOT wrap the JSON inside markdown blocks like \`\`\`json. Output ONLY the raw JSON string.`;
        } else {
          textPrompt = `You are an elite academic compiler, librarian, and research assistant.
You must use your real-time Google Search grounding tool to query authentic study websites, textbook repositories (such as OpenStax, Khan Academy, NCERT, CBSE, and other official academic portals) to fetch exact, real-world website links, textbooks, notes, and study material.

Subject: ${subjectName}
Topic: ${topic}
Title: ${title}
Resource Type: ${resourceType}

Your Core Objective:
1. Identify the single most direct, authoritative, and useful external website URL or online PDF link (e.g. from NCERT, Khan Academy, OpenStax, etc.) that satisfies the user's specific request. This will be the "primaryUrl".
2. Compile a curated directory listing of other highly relevant recommended websites with their names, direct links, and a professional review/description.
3. Create a beautifully formatted Markdown report summarizing all found websites, including bullet points, categories, clickable absolute links, and description.

You MUST return your response as a valid JSON object matching the following structure:
{
  "primaryUrl": "The direct absolute URL (starting with http:// or https://) of the most relevant website found that meets the user request",
  "primaryUrlTitle": "A professional name for this primary resource (e.g., NCERT Grade 12 Math Textbook)",
  "primaryUrlDescription": "A concise 1-2 sentence review of what this primary website provides and why it is the best match.",
  "allFoundWebsites": [
    {
      "url": "https://...",
      "title": "Title of the website",
      "category": "e.g., PDF Textbook, Interactive Courses, Lecture Videos, Practice Worksheets",
      "description": "A short, professional description of the website content and how it helps the student."
    }
  ],
  "markdownSummary": "# Curated Web Resources: [Title]\\n\\nWrite a beautifully structured, comprehensive, and exhaustive study directory in Markdown. Include headers, structured sections, bullet points, and clickable markdown links ([Link Text](URL)) for all recommended websites. Explain clearly what each site contains. Keep it premium, professional, and directly useful for exams and teaching."
}

Do NOT wrap the JSON inside markdown blocks like \`\`\`json. Output ONLY the raw JSON string.`;
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: textPrompt,
                    },
                  ],
                },
              ],
              tools: [
                {
                  googleSearch: {}
                }
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 3000,
                responseMimeType: "application/json"
              },
            }),
          }
        );

        if (!response.ok) {
          const errPayload = await response.json().catch(() => ({}));
          throw new Error(errPayload.error?.message || `Gemini API returned status ${response.status}`);
        }

        const data = await response.json();
        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (rawText) {
          generatedContent = rawText.trim();
          isRealAI = true;
        }
      } catch (geminiError) {
        console.error("Gemini API call failed, falling back to TuitionPro Local AI engine:", geminiError);
        // We will fall back to local AI rather than crashing, to provide standard robust user experience
      }
    }

    // Use high-fidelity local AI engine if real API failed or was not selected
    if (!generatedContent) {
      generatedContent = compileLocalAIResource(title, subjectName, batchName, resourceType, topic);
    }

    // Parse the generated JSON response
    let primaryUrl = "";
    let primaryUrlTitle = title;
    let markdownSummary = "";

    try {
      // Strip markdown wrapper if it exists (Gemini might sometimes add ```json even if responseMimeType is set)
      let cleanJson = generatedContent.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.substring(7);
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.substring(3);
      }
      if (cleanJson.endsWith("```")) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
      cleanJson = cleanJson.trim();

      const parsed = JSON.parse(cleanJson);
      primaryUrl = String(parsed.primaryUrl || "").trim();
      primaryUrlTitle = String(parsed.primaryUrlTitle || "").trim() || title;
      markdownSummary = String(parsed.markdownSummary || "").trim();
    } catch (err) {
      console.warn("Failed to parse JSON response, applying regex URL extraction fallback:", err);
      markdownSummary = generatedContent;
      
      // Try to find the first URL using regex
      const urlRegex = /(https?:\/\/[^\s\)]+)/;
      const match = urlRegex.exec(generatedContent);
      if (match) {
        primaryUrl = match[1];
      } else if (scrapedWebContent) {
        // Fallback to first URL in scraped web content
        const firstUrlRegex = /https?:\/\/[^\s\)]+/;
        const subMatch = firstUrlRegex.exec(scrapedWebContent);
        if (subMatch) {
          primaryUrl = subMatch[0];
        }
      }
      
      if (!primaryUrl) {
        primaryUrl = `https://www.google.com/search?q=${encodeURIComponent(topic + " " + subjectName)}`;
      }
    }

    // Save generated markdown to a physical .md file in uploads directory (for backup/reference)
    const id = randomUUID();
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "materials");
    await mkdir(uploadsDir, { recursive: true });

    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const uniqueFileNameMd = `${Date.now()}-ai-${safeTitle}.md`;
    const filePathMd = path.join(uploadsDir, uniqueFileNameMd);
    const fileBufferMd = Buffer.from(markdownSummary, "utf-8");

    await writeFile(filePathMd, fileBufferMd);

    // Compile and save the beautifully styled .pdf file using pdfkit as a catalog backup
    const uniqueFileNamePdf = `${Date.now()}-ai-${safeTitle}.pdf`;
    const filePathPdf = path.join(uploadsDir, uniqueFileNamePdf);
    
    try {
      await convertMarkdownToPDF(markdownSummary, filePathPdf);
    } catch (pdfCompileError) {
      console.error("Failed to compile PDF backup, falling back to writing text on PDF:", pdfCompileError);
      // Fallback simple PDF writer in case conversion fails to keep execution extremely robust
      const fontRegular = path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf");
      const doc = new PDFDocument({ font: fontRegular });
      doc.pipe(fs.createWriteStream(filePathPdf));
      doc.text(markdownSummary);
      doc.end();
    }

    const storedFileName = `${primaryUrlTitle}`;
    const storedFilePath = primaryUrl;
    const storedFileSize = `Website Link`;

    // Save record to DB using raw SQL or Prisma
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO study_materials (
        id,
        title,
        description,
        "subjectId",
        "batchId",
        "resourceType",
        "accessLevel",
        "resourceUrl",
        "fileName",
        "fileSize",
        "createdBy",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${title},
        ${markdownSummary || description || `AI generated study website for ${topic}`},
        ${subjectId},
        ${batchId},
        ${resourceType},
        ${accessLevel},
        ${storedFilePath},
        ${storedFileName},
        ${storedFileSize},
        ${auth.userId},
        NOW(),
        NOW()
      )
    `);

    // Fetch the newly created record with joins
    const [material] = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT
        sm.id,
        sm.title,
        sm.description,
        sm."subjectId",
        sm."batchId",
        sm."resourceType",
        sm."accessLevel",
        sm."resourceUrl",
        sm."fileName",
        sm."fileSize",
        sm."createdBy",
        sm."createdAt",
        sm."updatedAt",
        COALESCE(s.name, 'General') AS "subject",
        COALESCE(b.name, 'All Batches') AS "batch"
      FROM study_materials sm
      LEFT JOIN subjects s ON s.id = sm."subjectId"
      LEFT JOIN batches b ON b.id = sm."batchId"
      WHERE sm.id = ${id}
      LIMIT 1
    `);

    return NextResponse.json({
      success: true,
      isRealAI,
      content: markdownSummary,
      material: {
        ...material,
        subject: material?.subject ?? "General",
        batch: material?.batch ?? "All Batches",
        type: material?.resourceType,
        access: material?.accessLevel,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("AI Material Generation Route Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
