/**
 * The two ways to use a Business Toolkit, shown side by side on its page:
 *  1. Fill online and print: open the working tool made from this toolkit (a published tool with the SAME slug as the toolkit).
 *  2. Download and work offline: get the files (the existing purchase / download box on the same page).
 * If no published online version exists yet, the page says so plainly instead of showing a dead button.
 */
export interface ToolkitMode { id: 'online' | 'offline'; title: string; text: string; action: string; href: string | null }

export const OFFLINE_ANCHOR = '#get-it';

export function toolkitModes(slug: string, onlineName: string | null): ToolkitMode[] {
  return [
    onlineName
      ? { id: 'online', title: 'Fill online and print', text: 'Answer on screen, see the result at once, then print it or save it as PDF. Sign in to keep your work.', action: 'Open the online version →', href: `/tools/${slug}` }
      : { id: 'online', title: 'Fill online and print', text: 'The online version of this toolkit is being prepared. It will appear here once it has been reviewed.', action: 'Coming soon', href: null },
    { id: 'offline', title: 'Download and work offline', text: 'Get the files and work on them in your own time, on your own computer.', action: 'Get the files →', href: OFFLINE_ANCHOR },
  ];
}
