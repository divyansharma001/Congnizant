import type { ExplanationRecord, ProfileSummary as ProfileSummaryType } from "@/shared/api/contracts";
import { tw } from "@/shared/ui/tw";

type ProfileSummaryProps = {
  profile: ProfileSummaryType;
  explanations: ExplanationRecord;
};

export function ProfileSummary({ profile, explanations }: ProfileSummaryProps) {
  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
      <article className={`${tw.surface} ${tw.surfacePad}`}>
        <span className={tw.eyebrow}>Profile lens</span>
        <h2 className={`${tw.displayH2} mt-2 text-3xl`}>{profile.segment}</h2>
        <p className={`${tw.muted} mt-2`}>Top categories: {profile.topCategories.join(", ")}</p>
        <ul className={`${tw.chipList} mt-4`}>
          {profile.explicitPreferences.map((item) => (
            <li key={item.key} className={tw.chip}>
              {item.label}: {item.value}
            </li>
          ))}
        </ul>
      </article>
      <article className={`${tw.surface} ${tw.surfacePad}`}>
        <span className={tw.eyebrow}>Inferred interests</span>
        <div className={`${tw.stackSm} mt-4`}>
          {profile.inferredInterests.map((item) => (
            <div key={item.id}>
              <strong>{item.label}</strong>
              <p className={tw.muted}>
                {Math.round(item.confidence * 100)}% confidence from {item.source}
              </p>
            </div>
          ))}
        </div>
      </article>
      <article className={`${tw.surface} ${tw.surfacePad}`}>
        <span className={tw.eyebrow}>Why the app is reacting</span>
        <ul className={`${tw.stackSm} mt-4 list-disc pl-4 ${tw.muted}`}>
          {explanations.profileSignals.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
