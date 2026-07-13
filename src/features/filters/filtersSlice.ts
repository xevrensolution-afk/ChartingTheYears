import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { FULL_YEAR_MAX, FULL_YEAR_MIN, type FiltersState, type YearRange } from './types';

const initialState: FiltersState = {
  lang: [],
  type: [],
  yearRange: [FULL_YEAR_MIN, FULL_YEAR_MAX],
  rating: 0,
  tags: '',
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    toggleLanguage(state, action: PayloadAction<string>) {
      state.lang = toggle(state.lang, action.payload);
    },
    toggleType(state, action: PayloadAction<string>) {
      state.type = toggle(state.type, action.payload);
    },
    setYearRange(state, action: PayloadAction<YearRange>) {
      // Equality guard: identical values keep the same state reference so
      // effects that depend on the filters don't re-fire on mount syncs.
      const [min, max] = action.payload;
      if (state.yearRange[0] === min && state.yearRange[1] === max) return;
      state.yearRange = action.payload;
    },
    setRating(state, action: PayloadAction<number>) {
      state.rating = action.payload;
    },
    setTags(state, action: PayloadAction<string>) {
      state.tags = action.payload;
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const { toggleLanguage, toggleType, setYearRange, setRating, setTags, resetFilters } =
  filtersSlice.actions;
export const filtersReducer = filtersSlice.reducer;
