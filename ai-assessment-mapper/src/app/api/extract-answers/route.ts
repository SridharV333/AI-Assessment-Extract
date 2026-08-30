import { NextResponse } from "next/server";
import { gemini } from "@/lib/gemini";

export const runtime = "nodejs";

const answerExtractionPrompt = `
You are an expert handwritten-answer extraction system.

You are given a student's handwritten answer sheet.

Your task is to identify EVERY answer written by the student.

IMPORTANT:

1. Detect every question number written by the student.

2. Answers may be written OUT OF ORDER.

Example:

Question 1
Question 5
Question 3
Question 2

Do not assume answers are in question-paper order.

3. Detect unanswered questions by simply NOT creating an answer
for questions that have no handwritten response.

4. Preserve the question number exactly as written whenever possible.

5. Extract the student's handwritten answer as accurately as possible.

6. If handwriting is unclear, make your best transcription.

7. Do not invent text that is not present.

8. Answers may span multiple lines.

9. If an answer spans multiple consecutive regions on the same page,
combine those regions into one answer.

10. If an answer continues onto the next page, create one answer
with multiple bounding boxes.

11. IMPORTANT:
For every answer, identify the exact visual region containing the
student's handwritten response.

12. Coordinates must be normalized between 0 and 1000.

For example:

x = 100
y = 200
width = 400
height = 150

means the answer occupies that region of the page.

13. Do NOT include the question text inside the bounding box unless
the student has written the answer together with the question.

14. Printed question text should NOT be considered an answer.

15. Ignore printed instructions, headers, footers and page numbers.

16. Return ONLY valid JSON.

Use this structure:

{
  "answers": [
    {
      "questionNumber": "3(ii)",
      "text": "245",
      "page": 2,
      "boundingBoxes": [
        {
          "x": 120,
          "y": 300,
          "width": 250,
          "height": 80
        }
      ]
    }
  ]
}

If an answer has multiple regions, include multiple bounding boxes.

If no answers can be detected, return:

{
  "answers": []
}
`;

export async function POST(request: Request) {
  try {
    console.log("=================================");
    console.log("ANSWER EXTRACTION STARTED");
    console.log("=================================");

    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "No answer sheet was provided.",
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

    const arrayBuffer = await file.arrayBuffer();

    const base64Data =
      Buffer.from(arrayBuffer).toString("base64");

    console.log("Sending answer sheet to Gemini...");

    const response =
      await gemini.models.generateContent({
        model: "gemini-3-flash-preview",

        contents: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
          {
            text: answerExtractionPrompt,
          },
        ],

        config: {
          responseMimeType: "application/json",
        },
      });

    const responseText = response.text;

    if (!responseText) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    console.log("Gemini answer response:");
    console.log(responseText);

    const result = JSON.parse(responseText);

    if (!result || !Array.isArray(result.answers)) {
      throw new Error(
        "Gemini response does not contain a valid answers array."
      );
    }

    const answers = result.answers.map(
      (
        answer: {
          questionNumber: string | null;
          text: string;
          page: number;
          boundingBoxes: {
            x: number;
            y: number;
            width: number;
            height: number;
          }[];
        },
        index: number
      ) => ({
        id: `a-${index + 1}`,
        questionNumber: answer.questionNumber,
        text: answer.text,
        page: answer.page,
        boundingBoxes: answer.boundingBoxes,
      })
    );

    console.log(
      `Extracted ${answers.length} answers.`
    );

    return NextResponse.json({
      success: true,
      fileName: file.name,
      answers,
    });
  } catch (error) {
    console.error(
      "ANSWER EXTRACTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Answer extraction failed.",
      },
      { status: 500 }
    );
  }
}