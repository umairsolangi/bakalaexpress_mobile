import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationState {
  sector: string | null;
  nearArea: string | null;
  hasChosenLocation: boolean;

  setLocation: (sector: string, nearArea?: string | null) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      sector: null,
      nearArea: null,
      hasChosenLocation: false,

      setLocation: (sector: string, nearArea?: string | null) => {
        set({
          sector,
          nearArea: nearArea || null,
          hasChosenLocation: true,
        });
      },

      clearLocation: () => {
        set({
          sector: null,
          nearArea: null,
          hasChosenLocation: false,
        });
      },
    }),
    {
      name: 'bakala_customer_location_storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
