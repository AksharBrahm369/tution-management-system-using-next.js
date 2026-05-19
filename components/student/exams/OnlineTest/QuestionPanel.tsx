type Question = {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
};

export default function QuestionPanel({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer?: string;
  onAnswer: (value: string) => void;
}) {
  const options = [
    { key: "A", value: question.optionA },
    { key: "B", value: question.optionB },
    { key: "C", value: question.optionC },
    { key: "D", value: question.optionD },
  ].filter((item) => item.value);

  return (
    <div className="rounded-xl border p-5 dark:border-slate-700">
      <p className="text-sm text-slate-500">Question {question.questionNumber}</p>
      <p className="mt-2 font-medium">{question.questionText}</p>
      {question.questionType === "MCQ" ? (
        <div className="mt-4 space-y-2">
          {options.map((option) => (
            <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded border px-3 py-2">
              <input type="radio" checked={answer === option.key} onChange={() => onAnswer(option.key)} />
              <span>{option.key}. {option.value}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea className="mt-4 min-h-24 w-full rounded border px-3 py-2" value={answer ?? ""} onChange={(e) => onAnswer(e.target.value)} />
      )}
    </div>
  );
}
