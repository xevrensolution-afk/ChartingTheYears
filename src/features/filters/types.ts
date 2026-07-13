export type YearRange = [number, number];

export interface FiltersState {
  lang: string[];
  type: string[];
  yearRange: YearRange;
  rating: number;
  tags: string;
}

// Full allowed year range — filters only apply when the user narrows it.
export const FULL_YEAR_MIN = -1250;
export const FULL_YEAR_MAX = 2026;
