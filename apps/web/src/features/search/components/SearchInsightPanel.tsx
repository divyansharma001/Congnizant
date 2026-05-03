import { tw } from "@/shared/ui/tw";

type SearchInsightPanelProps = {
  personalized: boolean;
  query: string;
  explanations: string[];
};

export const SearchInsightPanel = ({
  personalized,
  query,
  explanations,
}: SearchInsightPanelProps) => {
  return (
    <section className={`${tw.surface} ${tw.surfacePad} ${tw.stackMd}`}>
      <span className={tw.eyebrow}>Search explainability</span>
      <h2 className={`${tw.displayH2} text-2xl`}>
        {personalized ? `Results for “${query}” are being re-ranked` : "Results are generic right now"}
      </h2>
      <ul className={`${tw.stackSm} list-disc pl-4 ${tw.muted}`}>
        {explanations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
};
