import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);
    const text = data.text;

    // 🔥 SIMPLE EXTRACTION
    const skills = extractSkills(text);
    const bio = text.slice(0, 500); // first part of resume

    return NextResponse.json({
        skills,
        bio,
        experienceLevel: "Fresher"
    });
}

// Basic skill detection
function extractSkills(text: string): string[] {
    const keywords = [
        "JavaScript", "React", "Node", "Python", "Machine Learning",
        "Deep Learning", "TensorFlow", "PyTorch", "NLP", "LLM",
        "Firebase", "Next.js"
    ];

    return keywords.filter(skill =>
        text.toLowerCase().includes(skill.toLowerCase())
    );
}