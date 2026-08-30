"use client";

import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import {
    useEffect,
} from "react";
import type {
    Question,
    Answer,
    QuestionAnswerMapping,
} from "@/types/assessment";
import {
    mapAnswersToQuestions,
} from "@/lib/mapAnswers";
import AnswerSheetViewer from "@/components/AnswerSheetViewer";
import FileUploader from "@/components/FileUploader";

export default function Home() {
    const [questionPaper, setQuestionPaper] = useState<File | null>(null);
    const [answerSheet, setAnswerSheet] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [mappings, setMappings] =
        useState<QuestionAnswerMapping[]>([]);

    const [unmatchedAnswers, setUnmatchedAnswers] =
        useState<Answer[]>([]);
    const [selectedQuestionId, setSelectedQuestionId] =
        useState<string | null>(null);
    const [answerSheetUrl, setAnswerSheetUrl] =
        useState<string | null>(null);
    const selectedMapping =
        mappings.find(
            (mapping) =>
                mapping.questionId ===
                selectedQuestionId
        );

    const selectedAnswer =
        selectedMapping?.answer ?? null;


    useEffect(() => {
        if (!answerSheet) {
            setAnswerSheetUrl(null);
            return;
        }

        const url =
            URL.createObjectURL(answerSheet);

        setAnswerSheetUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [answerSheet]);

    const canProcess = questionPaper !== null && answerSheet !== null;

    const handleProcess = async () => {
        if (!questionPaper || !answerSheet) {
            alert("Please upload both files.");
            return;
        }

        try {
            setIsProcessing(true);

            // ==========================================
            // STEP 1: EXTRACT QUESTIONS
            // ==========================================

            console.log("Extracting questions...");

            const questionFormData = new FormData();

            questionFormData.append(
                "file",
                questionPaper
            );

            const questionResponse = await fetch(
                "/api/extract-questions",
                {
                    method: "POST",
                    body: questionFormData,
                }
            );

            const questionData =
                await questionResponse.json();

            if (!questionResponse.ok) {
                throw new Error(
                    questionData.error ||
                    "Question extraction failed."
                );
            }

            setQuestions(questionData.questions);

            console.log(
                `Extracted ${questionData.questions.length} questions`
            );


            // ==========================================
            // STEP 2: EXTRACT ANSWERS
            // ==========================================

            console.log("Extracting student answers...");

            const answerFormData = new FormData();

            answerFormData.append(
                "file",
                answerSheet
            );

            const answerResponse = await fetch(
                "/api/extract-answers",
                {
                    method: "POST",
                    body: answerFormData,
                }
            );

            const answerData =
                await answerResponse.json();

            if (!answerResponse.ok) {
                throw new Error(
                    answerData.error ||
                    "Answer extraction failed."
                );
            }

            setAnswers(answerData.answers);

            console.log(
                `Extracted ${answerData.answers.length} answers`
            );
            const mappingResult =
                mapAnswersToQuestions(
                    questionData.questions,
                    answerData.answers
                );

            setMappings(mappingResult.mappings);

            setUnmatchedAnswers(
                mappingResult.unmatchedAnswers
            );

            console.log(
                "Question → Answer mappings:",
                mappingResult.mappings
            );

            console.log(
                "Unmatched answers:",
                mappingResult.unmatchedAnswers
            );

            console.log("Assessment extraction complete.");

        } catch (error) {
            console.error(
                "Assessment processing error:",
                error
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );

        } finally {
            setIsProcessing(false);
        }
    };



    return (
        <main className="min-h-screen bg-[#fafafa]">
            <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12">

                {/* Header */}
                <header className="mb-12">
                    <div className="mb-5 flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>

                        <span className="text-sm font-semibold text-gray-900">
                            Assessment AI
                        </span>
                    </div>

                    <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-gray-950 md:text-5xl">
                        Turn handwritten answer sheets into structured assessments.
                    </h1>

                    <p className="mt-4 max-w-2xl text-base leading-7 text-gray-500">
                        Upload a question paper and a student answer sheet. We&apos;ll
                        extract questions, identify answers, map them automatically, and
                        highlight the exact answer regions.
                    </p>
                </header>

                {/* Upload Card */}
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-950">
                            Upload documents
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Both files are required to start the assessment.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">

                        <FileUploader
                            label="Question paper"
                            description="Upload the printed question paper"
                            file={questionPaper}
                            onFileChange={setQuestionPaper}
                        />

                        <FileUploader
                            label="Student answer sheet"
                            description="Upload the handwritten answer sheet"
                            file={answerSheet}
                            onFileChange={setAnswerSheet}
                        />

                    </div>

                    {/* Validation */}
                    <div className="mt-8 rounded-2xl bg-gray-50 p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2
                                className={`mt-0.5 h-5 w-5 ${canProcess
                                    ? "text-green-600"
                                    : "text-gray-300"
                                    }`}
                            />

                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {canProcess
                                        ? "Ready to process"
                                        : "Upload both documents"}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Supported formats: PDF, PNG, JPG, JPEG and WebP. Maximum
                                    file size: 20 MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Process Button */}
                    <button
                        type="button"
                        disabled={!canProcess || isProcessing}
                        onClick={handleProcess}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                    >
                        {isProcessing ? "Preparing documents..." : "Start assessment"}

                        {!isProcessing && <ArrowRight className="h-4 w-4" />}
                    </button>

                </section>

                {/* ADD THE QUESTION LIST HERE */}
                {questions.length > 0 && (
                    <section className="mt-8">
                        <div className="mb-4">
                            <h2 className="text-2xl font-semibold">
                                Extracted Questions
                            </h2>

                            <p className="text-sm text-gray-500">
                                {questions.length} questions extracted
                            </p>
                        </div>

                        <div className="space-y-4">
                            {questions
                                .sort((a, b) => a.order - b.order)
                                .map((question) => (
                                    <div
                                        key={question.id}
                                        className="rounded-xl border bg-white p-5 shadow-sm"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="font-semibold">
                                                Question {question.number}
                                            </span>

                                            {question.marks !== null && (
                                                <span className="text-sm text-gray-500">
                                                    {question.marks} marks
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-gray-700">
                                            {question.text}
                                        </p>

                                        <p className="mt-2 text-xs text-gray-400">
                                            Page {question.page}
                                        </p>
                                    </div>
                                ))}
                        </div>
                    </section>
                )}

                {answers.length > 0 && (
                    <section className="mt-8">
                        <div className="mb-4">
                            <h2 className="text-2xl font-semibold">
                                Extracted Answers
                            </h2>

                            <p className="text-sm text-gray-500">
                                {answers.length} answers detected
                            </p>
                        </div>

                        <div className="space-y-4">
                            {answers.map((answer) => (
                                <div
                                    key={answer.id}
                                    className="rounded-xl border bg-white p-5 shadow-sm"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="font-semibold">
                                            Question{" "}
                                            {answer.questionNumber ?? "Unknown"}
                                        </span>

                                        <span className="text-sm text-gray-500">
                                            Page {answer.page}
                                        </span>
                                    </div>

                                    <p className="text-gray-700">
                                        {answer.text}
                                    </p>

                                    <div className="mt-3 text-xs text-gray-400">
                                        Bounding boxes:{" "}
                                        {answer.boundingBoxes?.length > 0}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ========================================= */}
                {/* ASSESSMENT / QUESTION-ANSWER MAPPING */}
                {/* ========================================= */}

                {mappings.length > 0 && (
                    <section className="mt-8">

                        {/* Assessment Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold">
                                Assessment
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Click a question to view the corresponding
                                answer on the student's answer sheet.
                            </p>
                        </div>

                        {/* Two-column layout */}
                        <div className="grid gap-6 lg:grid-cols-2">

                            {/* ========================================= */}
                            {/* LEFT — QUESTIONS */}
                            {/* ========================================= */}

                            <div className="space-y-3">

                                <div className="mb-3">
                                    <h3 className="text-lg font-semibold">
                                        Questions
                                    </h3>

                                    <p className="text-sm text-gray-500">
                                        {
                                            mappings.filter(
                                                (mapping) =>
                                                    mapping.status === "answered"
                                            ).length
                                        }{" "}
                                        answered ·{" "}
                                        {
                                            mappings.filter(
                                                (mapping) =>
                                                    mapping.status === "unanswered"
                                            ).length
                                        }{" "}
                                        unanswered
                                    </p>
                                </div>

                                {mappings.map((mapping) => {
                                    const isSelected =
                                        selectedQuestionId ===
                                        mapping.questionId;

                                    return (
                                        <div
                                            key={mapping.questionId}
                                            onClick={() =>
                                                setSelectedQuestionId(
                                                    mapping.questionId
                                                )
                                            }
                                            className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all duration-200 ${isSelected
                                                ? "border-blue-500 bg-blue-50 shadow-md"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                                }`}
                                        >

                                            {/* Question header */}
                                            <div className="flex items-center justify-between gap-3">

                                                <div className="flex items-center gap-3">

                                                    <div
                                                        className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold ${isSelected
                                                            ? "bg-blue-500 text-white"
                                                            : "bg-gray-100 text-gray-700"
                                                            }`}
                                                    >
                                                        {mapping.questionNumber}
                                                    </div>

                                                    <span className="font-medium">
                                                        Question{" "}
                                                        {mapping.questionNumber}
                                                    </span>

                                                </div>

                                                {/* Status */}
                                                {mapping.status ===
                                                    "answered" ? (
                                                    <span className="whitespace-nowrap text-sm font-medium text-green-600">
                                                        ✓ Answered
                                                    </span>
                                                ) : (
                                                    <span className="whitespace-nowrap text-sm font-medium text-red-500">
                                                        ✕ Unanswered
                                                    </span>
                                                )}

                                            </div>

                                            {/* Student answer */}
                                            {mapping.answer && (
                                                <div className="mt-3 rounded-lg bg-gray-50 p-3">

                                                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                                                        Student Answer
                                                    </p>

                                                    <p className="text-sm text-gray-700">
                                                        {mapping.answer.text}
                                                    </p>

                                                    <p className="mt-2 text-xs text-gray-400">
                                                        Page{" "}
                                                        {mapping.answer.page}
                                                    </p>

                                                </div>
                                            )}

                                            {/* Unanswered */}
                                            {!mapping.answer && (
                                                <div className="mt-3 rounded-lg bg-red-50 p-3">

                                                    <p className="text-sm text-red-500">
                                                        No answer detected for
                                                        this question.
                                                    </p>

                                                </div>
                                            )}

                                        </div>
                                    );
                                })}

                            </div>


                            {/* ========================================= */}
                            {/* RIGHT — ANSWER SHEET */}
                            {/* ========================================= */}

                            <div className="lg:sticky lg:top-6 lg:self-start">

                                <AnswerSheetViewer
                                    fileUrl={answerSheetUrl}
                                    selectedAnswer={selectedAnswer}
                                />

                            </div>

                        </div>


                        {/* ========================================= */}
                        {/* UNMATCHED ANSWERS */}
                        {/* ========================================= */}

                        {unmatchedAnswers.length > 0 && (
                            <section className="mt-8">

                                <div className="mb-4">
                                    <h3 className="text-xl font-semibold">
                                        Unmatched Answers
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        These answers were detected in the
                                        answer sheet but could not be matched
                                        to any extracted question.
                                    </p>
                                </div>

                                <div className="space-y-3">

                                    {unmatchedAnswers.map((answer) => (
                                        <div
                                            key={answer.id}
                                            className="rounded-xl border border-yellow-200 bg-yellow-50 p-4"
                                        >

                                            <div className="flex items-center justify-between">

                                                <span className="font-medium">
                                                    {answer.questionNumber
                                                        ? `Question ${answer.questionNumber}`
                                                        : "Unknown Question"}
                                                </span>

                                                <span className="text-sm text-gray-500">
                                                    Page {answer.page}
                                                </span>

                                            </div>

                                            <p className="mt-2 text-sm text-gray-700">
                                                {answer.text}
                                            </p>

                                        </div>
                                    ))}

                                </div>

                            </section>
                        )}

                    </section>
                )}

                {/* Footer */}
                <footer className="mt-auto pt-10 text-center text-xs text-gray-400">
                    AI-powered assessment extraction and answer mapping
                </footer>

            </div>
        </main>
    );
}