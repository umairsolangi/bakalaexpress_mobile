import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseToPaisa, paisaToString } from '../utils/money';

export interface CartItem {
  listingId: number;
  sellerId: number;
  name: string;
  unitPrice: string; // 2-decimal string format, e.g. "280.00"
  quantity: number;
  image: string | null;
  maxStock: number;
}

export interface AddItemResult {
  success: boolean;
  needsSellerConfirm?: boolean;
  conflictSellerId?: number;
  reason?: 'MAX_ITEMS' | 'OUT_OF_STOCK' | 'MAX_QUANTITY_REACHED';
}

export interface CartState {
  items: CartItem[];
  sellerId: number | null;
  sellerName: string | null;

  // Actions
  addItem: (
    item: Omit<CartItem, 'quantity'> & { quantity?: number },
    shopName?: string
  ) => AddItemResult;
  forceAddFromNewSeller: (
    item: Omit<CartItem, 'quantity'> & { quantity?: number },
    shopName?: string
  ) => void;
  updateQuantity: (listingId: number, quantity: number) => void;
  incrementQuantity: (listingId: number) => boolean;
  decrementQuantity: (listingId: number) => void;
  removeItem: (listingId: number) => void;
  clearCart: () => void;

  // Computations
  getTotalCount: () => number;
  getSubtotal: () => string;
  getItemQuantity: (listingId: number) => number;
}

export const MAX_ITEMS_LIMIT = 30;
export const MAX_QUANTITY_PER_ITEM = 20;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sellerId: null,
      sellerName: null,

      addItem: (item, shopName) => {
        const state = get();
        const quantityToAdd = item.quantity ?? 1;

        // Stock check
        if (item.maxStock <= 0) {
          return { success: false, reason: 'OUT_OF_STOCK' };
        }

        // Rule 1: One seller only
        if (state.items.length > 0 && state.sellerId !== null && state.sellerId !== item.sellerId) {
          return {
            success: false,
            needsSellerConfirm: true,
            conflictSellerId: state.sellerId,
          };
        }

        const existingIndex = state.items.findIndex((i) => i.listingId === item.listingId);

        // Rule 2: Max 30 distinct items
        if (existingIndex === -1 && state.items.length >= MAX_ITEMS_LIMIT) {
          return { success: false, reason: 'MAX_ITEMS' };
        }

        let updatedItems: CartItem[];

        if (existingIndex > -1) {
          const existing = state.items[existingIndex];
          const maxAllowed = Math.min(MAX_QUANTITY_PER_ITEM, item.maxStock);
          const newQuantity = Math.min(maxAllowed, existing.quantity + quantityToAdd);

          if (newQuantity === existing.quantity) {
            return { success: false, reason: 'MAX_QUANTITY_REACHED' };
          }

          updatedItems = [...state.items];
          updatedItems[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            maxStock: item.maxStock,
            unitPrice: String(item.unitPrice),
          };
        } else {
          const maxAllowed = Math.min(MAX_QUANTITY_PER_ITEM, item.maxStock);
          const initialQuantity = Math.min(maxAllowed, Math.max(1, quantityToAdd));

          updatedItems = [
            ...state.items,
            {
              listingId: item.listingId,
              sellerId: item.sellerId,
              name: item.name,
              unitPrice: String(item.unitPrice),
              quantity: initialQuantity,
              image: item.image,
              maxStock: item.maxStock,
            },
          ];
        }

        set({
          items: updatedItems,
          sellerId: item.sellerId,
          sellerName: shopName || state.sellerName || null,
        });

        return { success: true };
      },

      forceAddFromNewSeller: (item, shopName) => {
        if (item.maxStock <= 0) return;
        const maxAllowed = Math.min(MAX_QUANTITY_PER_ITEM, item.maxStock);
        const quantity = Math.min(maxAllowed, Math.max(1, item.quantity ?? 1));

        set({
          items: [
            {
              listingId: item.listingId,
              sellerId: item.sellerId,
              name: item.name,
              unitPrice: String(item.unitPrice),
              quantity,
              image: item.image,
              maxStock: item.maxStock,
            },
          ],
          sellerId: item.sellerId,
          sellerName: shopName || null,
        });
      },

      updateQuantity: (listingId, quantity) => {
        const state = get();
        if (quantity <= 0) {
          state.removeItem(listingId);
          return;
        }

        const updated = state.items.map((i) => {
          if (i.listingId === listingId) {
            const capped = Math.min(MAX_QUANTITY_PER_ITEM, i.maxStock, quantity);
            return { ...i, quantity: capped };
          }
          return i;
        });

        set({ items: updated });
      },

      incrementQuantity: (listingId) => {
        const state = get();
        const item = state.items.find((i) => i.listingId === listingId);
        if (!item) return false;

        const maxAllowed = Math.min(MAX_QUANTITY_PER_ITEM, item.maxStock);
        if (item.quantity >= maxAllowed) {
          return false;
        }

        state.updateQuantity(listingId, item.quantity + 1);
        return true;
      },

      decrementQuantity: (listingId) => {
        const state = get();
        const item = state.items.find((i) => i.listingId === listingId);
        if (!item) return;

        if (item.quantity <= 1) {
          state.removeItem(listingId);
        } else {
          state.updateQuantity(listingId, item.quantity - 1);
        }
      },

      removeItem: (listingId) => {
        const state = get();
        const remaining = state.items.filter((i) => i.listingId !== listingId);
        set({
          items: remaining,
          sellerId: remaining.length === 0 ? null : state.sellerId,
          sellerName: remaining.length === 0 ? null : state.sellerName,
        });
      },

      clearCart: () => {
        set({
          items: [],
          sellerId: null,
          sellerName: null,
        });
      },

      getTotalCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        const items = get().items;
        const totalPaisa = items.reduce((sum, item) => {
          const itemPaisa = parseToPaisa(item.unitPrice);
          return sum + itemPaisa * item.quantity;
        }, 0);
        return paisaToString(totalPaisa);
      },

      getItemQuantity: (listingId) => {
        const found = get().items.find((i) => i.listingId === listingId);
        return found ? found.quantity : 0;
      },
    }),
    {
      name: 'bakala_customer_cart_storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        sellerId: state.sellerId,
        sellerName: state.sellerName,
      }),
    }
  )
);
