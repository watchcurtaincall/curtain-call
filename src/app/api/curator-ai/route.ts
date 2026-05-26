import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { name, roleType, bio } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Artist name is required' }, { status: 400 });
    }

    const disciplines = roleType || 'Theatremaker';
    const contextBio = bio ? `Here is some basic context bio:\n${bio}` : '';

    const systemPrompt = `You are a curatorial assistant for "Curtain Call", the premier encyclopedia of theatrical and dramatic arts in West Africa.
Your task is to draft a highly professional, academic, Wikipedia-style artist profile structure based on the provided artist name, their discipline/role, and any optional bio details.

You must reply with a valid JSON object containing exactly three string fields:
1. "career": A structured narrative of their major theatrical milestones, regional festival participations, play productions, or notable creative stages.
2. "style": A professional analysis of their performance style, creative aesthetic, visual directing motifs, or thematic explorations.
3. "achievements": A detailed list of 2 to 4 bullet points outlining key career honors, verified playbill listings, or historical theatrical archives contributions. Do not include bullet symbols in the string array, just list them as plain strings.

Rules:
- Keep the tone strictly formal, scholarly, and encyclopedic.
- Write about this person as a major theatrical figure.
- Do NOT include generic placeholder words like "Lagos", "Nigeria", "Lagos Theatremaker", or "Curtain Call" unless they are explicitly referenced in the context. Keep the focus entirely on their professional artistic legacy.
- DO NOT use markdown formatting inside the fields. Return only plain text.
- If there is absolutely no way to infer or write something realistic based on the context bio, return empty strings for the fields: { "career": "", "style": "", "achievements": [] }

JSON Schema:
{
  "career": "string",
  "style": "string",
  "achievements": ["string", "string"]
}

Artist Name: ${name}
Role Type: ${disciplines}
${contextBio}

Begin. Return ONLY the strict JSON payload.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        career: '',
        style: '',
        achievements: []
      };
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'AI Drafting Engine exception',
    }, { status: 500 });
  }
}
