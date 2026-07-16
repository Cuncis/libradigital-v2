import { Heart } from 'lucide-react';

interface Milestone {
    year: string | null;
    text: string;
}

/**
 * Split the free-text love story into timeline milestones. Each non-empty line
 * becomes one milestone; an optional leading year (e.g. "2019 - Pertama bertemu",
 * "2019: ...", "2019 | ...", "2019 - ...") is pulled out as the milestone badge.
 */
function parseMilestones(story: string): Milestone[] {
    return story
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
            // Accept any common year/text separator the couple might type,
            // including en/em dashes. Hyphen is escaped so it isn't read as a range.
            const match = line.match(/^(\d{4})\s*[–—:|.)\-]*\s*(.*)$/);

            if (match && match[2].length > 0) {
                return { year: match[1], text: match[2] };
            }

            return { year: null, text: line };
        });
}

export default function LoveStoryTimeline({ story }: { story: string }) {
    const milestones = parseMilestones(story);

    // A single line with no year reads better as a simple paragraph than a
    // one-item timeline.
    if (milestones.length <= 1 && !milestones[0]?.year) {
        return (
            <p className="mx-auto max-w-xl leading-relaxed whitespace-pre-line text-muted-foreground">
                {story}
            </p>
        );
    }

    return (
        <ol className="mx-auto max-w-xl text-left">
            {milestones.map((milestone, index) => {
                const isLast = index === milestones.length - 1;

                return (
                    <li
                        key={index}
                        className="relative flex gap-5 pb-8 last:pb-0"
                    >
                        {/* Connector line + node */}
                        <div className="flex flex-col items-center">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--inv-accent)] bg-[var(--inv-card-bg)] text-[var(--inv-accent)] shadow-sm">
                                <Heart className="size-4 fill-current" />
                            </span>
                            {!isLast && (
                                <span
                                    className="mt-1 w-px flex-1 bg-gradient-to-b from-[var(--inv-accent)] to-transparent"
                                    aria-hidden
                                />
                            )}
                        </div>

                        {/* Content card */}
                        <div className="flex-1 rounded-2xl border border-[var(--inv-card-border)] bg-[var(--inv-card-bg)] px-5 py-4">
                            {milestone.year && (
                                <span className="inline-block rounded-full bg-[var(--inv-accent)]/10 px-3 py-0.5 [font-family:var(--inv-font-heading)] text-sm font-semibold tracking-wide text-[var(--inv-accent-strong)]">
                                    {milestone.year}
                                </span>
                            )}
                            <p className="mt-2 leading-relaxed text-muted-foreground">
                                {milestone.text}
                            </p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
