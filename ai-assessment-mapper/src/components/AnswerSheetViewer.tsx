
"use client";


import {
  useEffect,
  useState,
} from "react";

import type {
  Answer,
} from "@/types/assessment";

import PdfRenderer from "./PdfRenderer";

interface AnswerSheetViewerProps {
  fileUrl: string | null;
  selectedAnswer: Answer | null;
}

export default function AnswerSheetViewer({
  fileUrl,
  selectedAnswer,
}: AnswerSheetViewerProps) {
  const [
    numPages,
    setNumPages,
  ] = useState<number>(0);

  const [
    pageWidth,
    setPageWidth,
  ] = useState<number>(700);

  useEffect(() => {
    const updateWidth = () => {
      const width =
        window.innerWidth;

      if (width < 768) {
        setPageWidth(
          Math.min(
            width - 40,
            650
          )
        );
      } else {
        setPageWidth(700);
      }
    };

    updateWidth();

    window.addEventListener(
      "resize",
      updateWidth
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateWidth
      );
    };
  }, []);

  if (!fileUrl) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-xl border bg-gray-50">
        <p className="text-gray-400">
          Upload an answer sheet to
          view it here.
        </p>
      </div>
    );
  }

  console.log(
  "ANSWER SHEET FILE URL:",
  fileUrl
);

  const selectedPage =
  selectedAnswer?.page ?? 1;

  return (
    <div className="overflow-hidden rounded-xl border bg-gray-100">

      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">

        <div>
          <h3 className="font-semibold">
            Student Answer Sheet
          </h3>

          {selectedAnswer ? (
            <p className="text-sm text-gray-500">
              Question{" "}
              {selectedAnswer.questionNumber}
              {" · "}
              Page{" "}
              {selectedPage}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Select a question to view
              its answer.
            </p>
          )}
        </div>

      </div>


      {/* PDF */}
      <div className="max-h-[750px] overflow-auto p-4">

        <PdfRenderer
          fileUrl={fileUrl}
          selectedPage={selectedPage}
          selectedAnswer={
            selectedAnswer
          }
          pageWidth={pageWidth}
          onLoadSuccess={
            setNumPages
          }
        />

      </div>


      {/* Footer */}
      {numPages > 0 && (
        <div className="border-t bg-white px-4 py-3">
          <p className="text-center text-xs text-gray-400">
            Page {selectedPage} of{" "}
            {numPages}
          </p>
        </div>
      )}

    </div>
  );
}

