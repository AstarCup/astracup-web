import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let prohibitedWords: string[] = [];
let isLoaded = false;

async function loadVocabulary() {
  if (isLoaded) return;

  const vocabularyDir = path.join(process.cwd(), "src/app/api/content-detect/Vocabulary");

  try {
    const files = fs.readdirSync(vocabularyDir);

    for (const file of files) {
      if (file.endsWith(".txt")) {
        const filePath = path.join(vocabularyDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const words = content.split("\n").map(w => w.trim()).filter(w => w.length > 0);
        prohibitedWords.push(...words);
      }
    }

    isLoaded = true;
  } catch (error) {
    console.error("Failed to load vocabulary:", error);
  }
}

function checkProhibited(text: string): { isProhibited: boolean; triggeredWords: string[] } {
  const triggeredWords: string[] = [];
  const lowerText = text.toLowerCase();

  for (const word of prohibitedWords) {
    if (lowerText.includes(word.toLowerCase())) {
      triggeredWords.push(word);
    }
  }

  return {
    isProhibited: triggeredWords.length > 0,
    triggeredWords
  };
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { status: "error", message: "Text is required" },
        { status: 400 }
      );
    }

    await loadVocabulary();

    const result = checkProhibited(text);

    return NextResponse.json({
      status: "success",
      has_illegal: result.isProhibited,
      triggered_words: result.triggeredWords,
      text: text
    });
  } catch (error) {
    console.error("Content detection error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
