
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  Answer,
  BoundingBox,
} from "@/types/assessment";

interface PdfRendererProps {
  fileUrl: string;
  selectedPage: number;
  selectedAnswer: Answer | null;
  pageWidth: number;
  onLoadSuccess: (numPages: number) => void;
}

export default function PdfRenderer({
  fileUrl,
  selectedPage,
  selectedAnswer,
  pageWidth,
  onLoadSuccess,
}: PdfRendererProps) {

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {

    let cancelled = false;

    async function renderPdf() {

      try {

        setLoading(true);
        setError(null);

        /*
         * Import PDF.js only in the browser.
         *
         * This prevents Next.js from evaluating
         * PDF.js during the server/build phase.
         */
        const pdfjs =
          await import(
            "pdfjs-dist"
          );

        /*
         * Configure the worker dynamically.
         */
        pdfjs.GlobalWorkerOptions.workerSrc =
          new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url
          ).toString();


        /*
         * Load PDF.
         */
        if (
  !fileUrl ||
  typeof fileUrl !== "string"
) {
  throw new Error(
    "Invalid answer sheet URL."
  );
}

console.log(
  "Loading PDF:",
  fileUrl
);

const loadingTask =
  pdfjs.getDocument({
    url: fileUrl,
  });

        const pdf =
          await loadingTask.promise;
        
        console.log(
  "PDF LOADED:",
  pdf.numPages,
  "pages"
);


        if (cancelled) {
          return;
        }


        onLoadSuccess(
          pdf.numPages
        );


        /*
         * Make sure requested page exists.
         */
        const pageNumber =
          Math.min(
            Math.max(
              selectedPage,
              1
            ),
            pdf.numPages
          );


        /*
         * Get selected page.
         */
        const page =
          await pdf.getPage(
            pageNumber
          );

          console.log(
  "PDF PAGE LOADED:",
  pageNumber
);


        if (cancelled) {
          return;
        }


        /*
         * Get viewport at scale 1.
         */
        const initialViewport =
          page.getViewport({
            scale: 1,
          });


        /*
         * Calculate scale so that
         * rendered page matches our
         * requested width.
         */
        const scale =
          pageWidth /
          initialViewport.width;


        const viewport =
          page.getViewport({
            scale,
          });


        const canvas =
          canvasRef.current;


        if (!canvas) {
          return;
        }


        const context =
          canvas.getContext(
            "2d"
          );


        if (!context) {
          throw new Error(
            "Unable to create canvas context."
          );
        }


        /*
         * Set actual canvas dimensions.
         */
        canvas.width =
          viewport.width;

        canvas.height =
          viewport.height;


        /*
         * Set CSS dimensions too.
         */
        canvas.style.width =
          `${viewport.width}px`;

        canvas.style.height =
          `${viewport.height}px`;


        /*
         * Render PDF page.
         */
        console.log(
  "STARTING PDF RENDER:",
  {
    width: viewport.width,
    height: viewport.height,
  }
);

await page.render({
  canvas,
  canvasContext: context,
  viewport,
}).promise;

console.log(
  "PDF RENDER COMPLETE"
);


        if (!cancelled) {
          setLoading(false);
        }

      } catch (err) {

        console.error(
          "PDF rendering error:",
          err
        );

        if (!cancelled) {

          setError(
            "Failed to render the answer sheet."
          );

          setLoading(false);
        }

      }

    }


    if (fileUrl) {
      renderPdf();
    }


    return () => {
      cancelled = true;
    };

  }, [
    fileUrl,
    selectedPage,
    pageWidth,
    onLoadSuccess,
  ]);


  /*
   * Calculate highlight boxes.
   *
   * Gemini coordinates:
   * 0 → 1000
   *
   * CSS:
   * 0% → 100%
   */
  const boundingBoxes =
  selectedAnswer?.page === selectedPage
    ? selectedAnswer.boundingBoxes ?? []
    : [];


  return (

    <div
      ref={containerRef}
      className="relative mx-auto w-fit"
    >

      {/* PDF Canvas */}

      <canvas
        ref={canvasRef}
        className="block"
      />


      {/* Loading */}

      {loading && (

        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">

          <p className="text-sm text-gray-500">
            Rendering page...
          </p>

        </div>

      )}


      {/* Error */}

      {error && (

        <div className="flex min-h-[500px] items-center justify-center">

          <p className="text-sm text-red-500">
            {error}
          </p>

        </div>

      )}


      {/* ================================= */}
      {/* ANSWER HIGHLIGHTS */}
      {/* ================================= */}

      {!loading &&
        boundingBoxes.length > 0 && (

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              zIndex: 20,
            }}
          >

            {boundingBoxes.map(
              (
                box,
                index
              ) => (

                <div
                  key={index}
                  className="absolute rounded-md border-2 border-blue-500 bg-blue-400/20"
                  style={{
                    left:
                      `${box.x / 10}%`,

                    top:
                      `${box.y / 10}%`,

                    width:
                      `${box.width / 10}%`,

                    height:
                      `${box.height / 10}%`,
                  }}
                />

              )
            )}

          </div>

        )}

    </div>
  );
}

