import {
  Question,
  Answer,
  QuestionAnswerMapping,
} from "@/types/assessment";

/**
 * Converts different question-number formats
 * into a common representation.
 *
 * Examples:
 *
 * 1(i)          -> 1i
 * 1 (i)         -> 1i
 * Q1(i)         -> 1i
 * Question 1(i) -> 1i
 * 1) (i)        -> 1i
 * 1(ii).        -> 1ii
 */
function normalizeQuestionNumber(
  value: string | null
): string {
  if (!value) {
    return "";
  }

  let normalized = value
    .toLowerCase()
    .trim();

  // Remove words such as "question" and "q"
  normalized = normalized
    .replace(/^question\s*/i, "")
    .replace(/^q\s*/i, "");

  // Remove spaces
  normalized = normalized.replace(/\s+/g, "");

  // Remove common punctuation
  normalized = normalized.replace(
    /[()[\]{}.,:;_-]/g,
    ""
  );

  // Remove repeated question-number markers
  //
  // Examples:
  // 1)1) -> 11
  // 1)3) -> 13
  //
  // We handle these below as well.
  normalized = normalized.replace(/\)/g, "");

  return normalized;
}


/**
 * Extracts the meaningful question identifier.
 *
 * This helps when Gemini returns things such as:
 *
 * "1) 1)"
 * "Question 1(i)"
 * "Q1(ii)"
 * "1(iii)"
 */
function getQuestionKey(
  value: string | null
): string {
  if (!value) {
    return "";
  }

  let valueToProcess =
    value.toLowerCase().trim();

  // Remove "question"
  valueToProcess =
    valueToProcess.replace(
      /^question\s*/i,
      ""
    );

  // Remove "q"
  valueToProcess =
    valueToProcess.replace(
      /^q\s*/i,
      ""
    );

  /*
   * Look for a normal pattern:
   *
   * 1(i)
   * 1(ii)
   * 2(a)
   * 10(b)
   */
  const standardMatch =
    valueToProcess.match(
      /^(\d+)\s*[\(\[]?\s*([ivx]+|[a-z])\s*[\)\]]?/i
    );

  if (standardMatch) {
    const questionNumber =
      standardMatch[1];

    const subPart =
      standardMatch[2];

    return (
      questionNumber +
      subPart.toLowerCase()
    );
  }

  /*
   * Handle Gemini formats such as:
   *
   * "1) 1)"
   * "1) 3)"
   * "2) i)"
   *
   * In these cases, the last meaningful
   * number/roman numeral is usually the
   * sub-question.
   */
  const repeatedMatch =
    valueToProcess.match(
      /^(\d+)\)?\s*(?:\(?\s*)?([ivx]+|\d+|[a-z])\)?/i
    );

  if (repeatedMatch) {
    const questionNumber =
      repeatedMatch[1];

    const subPart =
      repeatedMatch[2];

    /*
     * If the second part is another number,
     * this is probably Gemini's representation
     * of a sub-question.
     *
     * Example:
     *
     * 1) 3) -> 1iii
     *
     * But don't blindly convert all numbers.
     */

    if (/^\d+$/.test(subPart)) {
      const romanMap: Record<
        string,
        string
      > = {
        "1": "i",
        "2": "ii",
        "3": "iii",
        "4": "iv",
        "5": "v",
        "6": "vi",
        "7": "vii",
        "8": "viii",
        "9": "ix",
        "10": "x",
      };

      return (
        questionNumber +
        (romanMap[subPart] ?? subPart)
      );
    }

    return (
      questionNumber +
      subPart.toLowerCase()
    );
  }

  return normalizeQuestionNumber(
    value
  );
}


export function mapAnswersToQuestions(
  questions: Question[],
  answers: Answer[]
): {
  mappings: QuestionAnswerMapping[];
  unmatchedAnswers: Answer[];
} {

  const usedAnswerIds =
    new Set<string>();


  const mappings =
    questions.map((question) => {

      const questionKey =
        getQuestionKey(
          question.number
        );

      console.log(
        `Mapping question ${question.number} → ${questionKey}`
      );


      const matchingAnswer =
        answers.find((answer) => {

          if (
            usedAnswerIds.has(
              answer.id
            )
          ) {
            return false;
          }

          if (
            !answer.questionNumber
          ) {
            return false;
          }

          const answerKey =
            getQuestionKey(
              answer.questionNumber
            );

          console.log(
            `Comparing ${questionKey} with ${answerKey}`
          );

          return (
            answerKey ===
            questionKey
          );
        });


      if (matchingAnswer) {

        usedAnswerIds.add(
          matchingAnswer.id
        );

        return {
          questionId:
            question.id,

          questionNumber:
            question.number,

          answerId:
            matchingAnswer.id,

          answer:
            matchingAnswer,

          status:
            "answered" as const,
        };
      }


      return {
        questionId:
          question.id,

        questionNumber:
          question.number,

        answerId:
          null,

        answer:
          null,

        status:
          "unanswered" as const,
      };

    });


  const unmatchedAnswers =
    answers.filter(
      (answer) =>
        !usedAnswerIds.has(
          answer.id
        )
    );


  return {
    mappings,
    unmatchedAnswers,
  };
}