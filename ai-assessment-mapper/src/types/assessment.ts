export type ProcessingStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "error";

export type AnswerStatus =
  | "MATCHED"
  | "UNANSWERED"
  | "UNMATCHED"
  | "REVIEW_REQUIRED";


export interface AnswerRegion {
  page: number;

  /**
   * Coordinates normalized between 0 and 1.
   *
   * Example:
   * x = 0.12 means 12% from the left.
   */
  bbox: BoundingBox;
}

export interface Question {
  id: string;
  number: string;
  text: string;
  order: number;
  marks: number | null;
  page: number;
}

export interface QuestionExtractionResponse {
  success: boolean;
  fileName?: string;
  questions: Question[];
  error?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Answer {
  id: string;
  questionNumber: string | null;
  text: string;
  page: number;
  boundingBoxes: BoundingBox[];
}

export interface AnswerExtractionResponse {
  success: boolean;
  fileName?: string;
  answers: Answer[];
  error?: string;
}

export interface QuestionAnswerMapping {
  questionId: string;
  questionNumber: string;
  answerId: string | null;
  answer: Answer | null;
  status: "answered" | "unanswered" | "unmatched";
}

export interface StudentAnswer {
  id: string;

  /**
   * The question this answer was mapped to.
   */
  questionId?: string;

  /**
   * AI transcription of the handwriting.
   */
  transcription?: string;

  /**
   * One answer can span multiple pages.
   */

  confidence: number;

  status: AnswerStatus;

  detectedQuestionNumber?: string;
}

export interface Assessment {
  id: string;

  questionPaperName: string;

  answerSheetName: string;

  questions: Question[];

  answers: StudentAnswer[];

  createdAt: string;
}

export interface ProcessingProgress {
  stage:
    | "uploading"
    | "rendering"
    | "extracting_questions"
    | "extracting_answers"
    | "mapping"
    | "grading"
    | "completed";

  progress: number;

  message: string;
}