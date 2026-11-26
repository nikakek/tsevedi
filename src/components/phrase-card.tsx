"use client";

import { Languages, X } from "lucide-react";
import { useRef, useState } from "react";

export type PhraseCardContent = {
  buttonLabel: string;
  closeLabel: string;
  meaningLabel: string;
  driver: { title: string; lines: string[]; meaning: string };
  staff: { title: string; hint: string; lines: string[]; meaning: string; phone: string };
};

/** Full-screen Georgian text to show a driver, or hostel staff who can phone the driver. */
export function PhraseCardButton({ content }: { content: PhraseCardContent }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"driver" | "staff">("driver");
  const card = tab === "driver" ? content.driver : content.staff;

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => dialog.current?.showModal()}
      >
        <Languages className="size-4" aria-hidden />
        {content.buttonLabel}
      </button>
      <dialog
        ref={dialog}
        className="bg-surface m-0 h-dvh max-h-none w-screen max-w-none p-0 backdrop:bg-black/60 sm:m-auto sm:h-auto sm:max-w-xl sm:rounded-2xl"
        onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      >
        <div className="flex h-full flex-col">
          <div className="border-line flex items-center gap-2 border-b p-3">
            <div role="tablist" className="flex flex-1 gap-1">
              {(["driver", "staff"] as const).map((key) => (
                <button
                  key={key}
                  role="tab"
                  type="button"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className="text-muted aria-selected:bg-ink aria-selected:text-canvas rounded-full px-4 py-2 text-sm font-medium"
                >
                  {content[key].title}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="hover:bg-canvas rounded-full p-2.5"
              aria-label={content.closeLabel}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div
            role="tabpanel"
            className="flex flex-1 flex-col justify-center gap-6 overflow-auto p-6"
          >
            {tab === "staff" && <p className="text-muted text-sm">{content.staff.hint}</p>}
            <p lang="ka" className="text-3xl leading-snug font-semibold sm:text-4xl">
              {card.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            {tab === "staff" && (
              <p
                className="text-brand-700 text-3xl font-semibold tracking-tight tracking-wide md:text-4xl"
                dir="ltr"
              >
                {content.staff.phone}
              </p>
            )}
            <div className="bg-canvas text-muted rounded-2xl p-4 text-sm">
              <span className="text-ink font-semibold">{content.meaningLabel}: </span>
              {card.meaning}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
