import { useCartStore } from '../cartStore';

describe('Cart Store Rules', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('enforces single seller rule: requires confirmation when adding from a second seller', () => {
    const store = useCartStore.getState();

    // Add item from Seller 1
    const res1 = store.addItem(
      {
        listingId: 101,
        sellerId: 1,
        name: 'Milk 1L',
        unitPrice: '280.00',
        maxStock: 10,
        image: null,
      },
      'Seller One'
    );
    expect(res1.success).toBe(true);
    expect(res1.needsSellerConfirm).toBeFalsy();

    // Try adding item from Seller 2
    const res2 = useCartStore.getState().addItem(
      {
        listingId: 201,
        sellerId: 2,
        name: 'Bread',
        unitPrice: '120.00',
        maxStock: 5,
        image: null,
      },
      'Seller Two'
    );
    expect(res2.success).toBe(false);
    expect(res2.needsSellerConfirm).toBe(true);

    // Cart still only contains item from Seller 1
    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].listingId).toBe(101);
  });

  it('allows replacing cart items with forceAddFromNewSeller', () => {
    const store = useCartStore.getState();

    store.addItem(
      {
        listingId: 101,
        sellerId: 1,
        name: 'Milk 1L',
        unitPrice: '280.00',
        maxStock: 10,
        image: null,
      },
      'Seller One'
    );

    useCartStore.getState().forceAddFromNewSeller(
      {
        listingId: 201,
        sellerId: 2,
        name: 'Bread',
        unitPrice: '120.00',
        maxStock: 5,
        image: null,
      },
      'Seller Two'
    );

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.sellerId).toBe(2);
    expect(state.sellerName).toBe('Seller Two');
    expect(state.items[0].listingId).toBe(201);
  });

  it('caps quantity to maxStock and 20 per item', () => {
    const store = useCartStore.getState();

    // Item with low stock (3)
    store.addItem({
      listingId: 301,
      sellerId: 1,
      name: 'Eggs',
      unitPrice: '30.00',
      maxStock: 3,
      quantity: 5, // Tries to add 5
      image: null,
    });

    expect(useCartStore.getState().items[0].quantity).toBe(3);

    // Item with huge stock (100) -> capped at 20
    useCartStore.getState().clearCart();
    useCartStore.getState().addItem({
      listingId: 302,
      sellerId: 1,
      name: 'Flour 10kg',
      unitPrice: '1200.00',
      maxStock: 100,
      quantity: 25, // Tries to add 25
      image: null,
    });

    expect(useCartStore.getState().items[0].quantity).toBe(20);
  });

  it('enforces maximum 30 distinct items limit', () => {
    const store = useCartStore.getState();

    for (let i = 1; i <= 30; i++) {
      store.addItem({
        listingId: i,
        sellerId: 1,
        name: `Item ${i}`,
        unitPrice: '10.00',
        maxStock: 10,
        image: null,
      });
    }

    expect(useCartStore.getState().items.length).toBe(30);

    // 31st item should be rejected
    const res = useCartStore.getState().addItem({
      listingId: 31,
      sellerId: 1,
      name: 'Item 31',
      unitPrice: '10.00',
      maxStock: 10,
      image: null,
    });

    expect(res.success).toBe(false);
    expect(res.reason).toBe('MAX_ITEMS');
    expect(useCartStore.getState().items.length).toBe(30);
  });

  it('calculates subtotal with string money without float errors', () => {
    const store = useCartStore.getState();

    // 2 x 280.00 = 560.00
    store.addItem({
      listingId: 101,
      sellerId: 1,
      name: 'Milk 1L',
      unitPrice: '280.00',
      maxStock: 10,
      quantity: 2,
      image: null,
    });

    // 3 x 15.50 = 46.50
    store.addItem({
      listingId: 102,
      sellerId: 1,
      name: 'Candy',
      unitPrice: '15.50',
      maxStock: 10,
      quantity: 3,
      image: null,
    });

    // Subtotal should be 560.00 + 46.50 = 606.50
    const subtotal = useCartStore.getState().getSubtotal();
    expect(subtotal).toBe('606.50');
  });
});
