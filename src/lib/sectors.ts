/**
 * Canonical list of marketplace sectors. Used in:
 *  - Specialist asset submission (checkbox selection)
 *  - Specialist asset edit (checkbox selection)
 *  - Marketplace browse page (filter dropdown)
 *  - Marketplace detail page (badge display)
 *
 * If an asset has zero sectors selected the marketplace falls back to
 * "All Sectors" which makes it visible in every filter view.
 */
export const MARKETPLACE_SECTORS = [
  "Manufacturing",
  "Retail",
  "Consumer Products",
  "Logistics",
] as const;

export type MarketplaceSector = (typeof MARKETPLACE_SECTORS)[number];
