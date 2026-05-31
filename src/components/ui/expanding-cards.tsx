"use client";

import Link from "next/link";
import * as React from "react";

export interface CardItem {
  id: string | number;
  title: string;
  description: string;
  imgSrc: string;
  linkHref: string;
  eyebrow?: string;
  linkLabel?: string;
}

interface ExpandingCardsProps extends React.HTMLAttributes<HTMLUListElement> {
  items: CardItem[];
  defaultActiveIndex?: number;
}

export const ExpandingCards = React.forwardRef<HTMLUListElement, ExpandingCardsProps>(
  ({ className, items, defaultActiveIndex = 0, ...props }, ref) => {
    const activeIndex = Math.min(defaultActiveIndex, Math.max(items.length - 1, 0));

    return (
      <ul
        ref={ref}
        className={[
          "grid w-full gap-4",
          "grid-cols-1 sm:grid-cols-2 xl:grid-cols-5",
          className,
        ].filter(Boolean).join(" ")}
        {...props}
      >
        {items.map((item, index) => (
          <li
            key={item.id}
            data-active={activeIndex === index}
            className="group relative min-h-0 min-w-0 overflow-hidden rounded-4xl border border-white/70 bg-slate-900 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.24)]"
          >
            <Link
              href={item.linkHref}
              aria-label={item.title}
              className="absolute inset-0 z-20 outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            />

            <img
              src={item.imgSrc}
              alt={item.title}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.22)_42%,rgba(2,6,23,0.9)_100%)] transition duration-300 group-hover:bg-[linear-gradient(180deg,rgba(2,6,23,0.06)_0%,rgba(2,6,23,0.18)_42%,rgba(2,6,23,0.86)_100%)]" />

            <div className="relative z-10 flex h-full min-h-[22rem] flex-col justify-between p-5 sm:min-h-[24rem] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/85 backdrop-blur">
                  0{index + 1}
                </span>
                {item.eyebrow ? (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/85 backdrop-blur">
                    {item.eyebrow}
                  </span>
                ) : null}
              </div>

              <div className="max-w-lg space-y-2">
                <h3 className="text-2xl font-black leading-tight text-white sm:text-[1.9rem]">
                  {item.title}
                </h3>
                {item.description ? (
                  <p className="max-w-xl text-sm leading-6 text-white/84 sm:text-base">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  },
);

ExpandingCards.displayName = "ExpandingCards";