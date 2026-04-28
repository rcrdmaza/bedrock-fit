'use client';

// Tab shell for the event detail page. Only renders the tabs that have
// content — the caller decides by passing only the tabs whose data is
// non-empty. Keeping visibility at the caller means this component
// stays dumb about what a "filled" tab looks like per section.

import { useState } from 'react';

export type EventTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export default function EventTabs({ tabs }: { tabs: EventTab[] }) {
  // Default to the first tab — guaranteed to exist because the parent
  // filters out empty tabs before passing the array in.
  const [active, setActive] = useState<string>(tabs[0]?.id ?? '');

  if (tabs.length === 0) return null;

  // Single tab: skip the tablist entirely so there's no "tabs UI for
  // one thing" weirdness when only Results has content.
  if (tabs.length === 1) {
    return <div>{tabs[0].content}</div>;
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Event sections"
        className="flex gap-1 border-b border-slate-100 mb-6"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`tabpanel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.id === active ? tab.content : null}
        </div>
      ))}
    </div>
  );
}
