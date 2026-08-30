import { NextResponse } from "next/server";
import { gemini } from "@/lib/gemini";

export const runtime = "nodejs";

const extractionPrompt = `
You are an expert question-paper extraction system.

Your task is to extract EVERY question from the provided question paper.

IMPORTANT RULES:

1. Preserve the original printed order.

2. Preserve the original question numbering exactly as printed.

3. Treat labelled sub-parts as separate questions.

Example:

11. Answer the following:
(a) Explain photosynthesis.
(b) Explain respiration.

MUST become:

11(a)
11(b)

4. Do NOT merge sub-questions.

5. Do NOT skip questions.

6. Do NOT invent questions.

7. If a question continues onto another page, combine its complete
question text into one question.

8. Preserve mathematical expressions, symbols, units and notation.

9. For multiple-choice questions, include ALL options in the question text.

10. Include:
- text questions
- mathematical questions
- multiple-choice questions
- fill-in-the-blanks
- true/false
- tables
- diagram-based questions
- labelled sub-parts

11. The "order" field represents the physical order in which the
question appears in the paper.

12. The "page" field is the 1-based page number where the question begins.

13. If marks are explicitly visible, extract them.
Otherwise use null.

14. Return ONLY valid JSON.

Use exactly this structure:

{
  "questions": [
    {
      "number": "1",
      "text": "What is photosynthesis?",
      "order": 1,
      "marks": 2,
      "page": 1
    }
  ]
}
`;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithRetry(
  base64Data: string,
  mimeType: string
) {
  const models = [
    "gemini-3.7-flash",
    "gemini-3-flash-preview",
  ];

  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `Trying ${model}, attempt ${attempt}`
        );

        const response = await gemini.models.generateContent({
          model,

          contents: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: extractionPrompt,
            },
          ],

          config: {
            responseMimeType: "application/json",
            temperature: 0,
          },
        });

        return response;
      } catch (error) {
        lastError = error;

        console.error(
          `${model} attempt ${attempt} failed:`,
          error
        );

        if (attempt < 2) {
          console.log("Retrying in 2 seconds...");
          await sleep(2000);
        }
      }
    }

    console.log(
      `${model} failed. Trying fallback model...`
    );
  }

  throw lastError;
}

export async function POST(request: Request) {
  try {
    console.log("=================================");
    console.log("QUESTION EXTRACTION STARTED");
    console.log("=================================");

    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "No question paper was provided.",
        },
        { status: 400 }
      );
    }

    console.log("File:", file.name);
    console.log("Type:", file.type);
    console.log("Size:", file.size);

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported file type. Please upload a PDF or image.",
        },
        { status: 400 }
      );
    }

    const maxSize = 20 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "File size must be less than 20 MB.",
        },
        { status: 400 }
      );
    }

    console.log("Converting document...");

    const arrayBuffer = await file.arrayBuffer();

    const base64Data =
      Buffer.from(arrayBuffer).toString("base64");

    console.log("Sending document to Gemini...");

    const response = await generateWithRetry(
      base64Data,
      file.type
    );

    console.log("Gemini response received.");

    const responseText = response.text;

    if (!responseText) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    console.log("Gemini response:");
    console.log(responseText);

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(
        "Gemini returned invalid JSON."
      );
    }

    if (
      !result ||
      !Array.isArray(result.questions)
    ) {
      throw new Error(
        "Gemini response does not contain a valid questions array."
      );
    }

    console.log(
      `Extracted ${result.questions.length} questions.`
    );

    const questions = result.questions.map(
      (question: {
        number: string;
        text: string;
        order: number;
        marks: number | null;
        page: number;
      }, index: number) => ({
        id: `q-${index + 1}`,
        number: question.number,
        text: question.text,
        order: question.order,
        marks: question.marks ?? null,
        page: question.page,
      })
    );

    return NextResponse.json({
      success: true,
      fileName: file.name,
      questions,
    });
  } catch (error) {
    console.error(
      "QUESTION EXTRACTION FAILED:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Question extraction failed.",
      },
      { status: 500 }
    );
  }
}