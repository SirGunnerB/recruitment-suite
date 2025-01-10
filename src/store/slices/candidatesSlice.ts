import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { db } from '../../database/db';
import { Candidate } from '../../types';
import { createLogger } from '../../utils/logger';

const logger = createLogger('store:candidates');

interface CandidatesState {
  items: Candidate[];
  loading: boolean;
  error: string | null;
}

const initialState: CandidatesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCandidates = createAsyncThunk(
  'candidates/fetchCandidates',
  async () => {
    try {
      const candidates = await db.candidates.toArray();
      return candidates;
    } catch (error) {
      logger.error('Error fetching candidates:', error);
      throw error;
    }
  }
);

export const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    setCandidates: (state, action: PayloadAction<Candidate[]>) => {
      state.items = action.payload;
    },
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      state.items.push(action.payload);
    },
    updateCandidate: (state, action: PayloadAction<Candidate>) => {
      const index = state.items.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeCandidate: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(c => c.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch candidates';
      });
  },
});

export const { setCandidates, addCandidate, updateCandidate, removeCandidate } = candidatesSlice.actions;
export default candidatesSlice.reducer;
