import {
  getSellerDashboard,
  getSellerOrders,
  getSellerOrderDetail,
  confirmSellerOrder,
  prepareSellerOrder,
  readySellerOrder,
  rejectSellerOrder,
  completeSellerOrder,
  getSellerOperatingHours,
  updateSellerOperatingHours,
  getSellerEarnings,
  getSellerCatalogListings,
  updateSellerListing,
  getSellerVerificationStatus,
  submitSellerVerification,
  getSellerOrderMessages,
  sendSellerOrderMessage,
  markSellerOrderMessagesRead,
} from '../seller';

const originalFetch = globalThis.fetch;

describe('Seller API Endpoints', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('getSellerDashboard calls GET /seller/dashboard', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          store: { id: 1, name: 'Test Shop', is_open: true },
          order_badges: { pending: 2, active_total: 5 },
          today: { sales: '1500.00', orders_count: 3 },
        },
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    const res = await getSellerDashboard();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/seller/dashboard');
    expect(res.data.store.name).toBe('Test Shop');
    expect(res.data.order_badges.pending).toBe(2);
  });

  it('getSellerOrders sends status filter and pagination params', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [{ id: 101, status: 'pending', total_amount: '500.00' }],
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    const res = await getSellerOrders('pending', 2, 10);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/seller/orders?');
    expect(url).toContain('status=pending');
    expect(url).toContain('page=2');
    expect(url).toContain('per_page=10');
    expect(res.data[0].id).toBe(101);
  });

  it('order lifecycle transitions: confirm, prepare, ready, reject, complete', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { id: 101, status: 'confirmed_by_seller' },
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    // Confirm
    await confirmSellerOrder(101);
    expect(fetchMock.mock.calls[0][0]).toContain('/seller/orders/101/confirm');

    // Prepare
    await prepareSellerOrder(101);
    expect(fetchMock.mock.calls[1][0]).toContain('/seller/orders/101/prepare');

    // Ready
    await readySellerOrder(101);
    expect(fetchMock.mock.calls[2][0]).toContain('/seller/orders/101/ready');

    // Reject with reason
    await rejectSellerOrder(101, 'Out of stock');
    expect(fetchMock.mock.calls[3][0]).toContain('/seller/orders/101/reject');
    expect(fetchMock.mock.calls[3][1].body).toContain('Out of stock');

    // Complete
    await completeSellerOrder(101);
    expect(fetchMock.mock.calls[4][0]).toContain('/seller/orders/101/complete');
  });

  it('operating hours GET and PUT endpoints', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { is_open: true, opens_at: '09:00', closes_at: '22:00' },
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    await getSellerOperatingHours();
    expect(fetchMock.mock.calls[0][0]).toContain('/seller/operating-hours');

    await updateSellerOperatingHours({ is_open: false, opens_at: '10:00', closes_at: '21:00' });
    expect(fetchMock.mock.calls[1][0]).toContain('/seller/operating-hours');
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
  });

  it('getSellerEarnings calls GET /seller/earnings', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          summary: { today: '120.00', all_time: '5000.00', total_completed_orders: 12 },
          monthly_chart: [],
        },
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    const res = await getSellerEarnings();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/seller/earnings');
    expect(res.data.summary.total_completed_orders).toBe(12);
  });

  it('catalog listings and update endpoints', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { listing_id: 5, custom_price: '99.00', stock_quantity: 20 },
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    await getSellerCatalogListings({ search: 'milk', page: 1 });
    expect(fetchMock.mock.calls[0][0]).toContain('/seller/catalog/listings?');
    expect(fetchMock.mock.calls[0][0]).toContain('search=milk');

    await updateSellerListing(5, { custom_price: 99, stock_quantity: 20 });
    expect(fetchMock.mock.calls[1][0]).toContain('/seller/catalog/listings/5');
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
  });

  it('verification status and submission', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { is_verified: false, has_submitted: true, verification: null },
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    await getSellerVerificationStatus();
    expect(fetchMock.mock.calls[0][0]).toContain('/seller/verification/status');

    await submitSellerVerification({
      business_description: 'Grocery store since 2018',
      reason_for_verification: 'Neighborhood delivery partner',
    });
    expect(fetchMock.mock.calls[1][0]).toContain('/seller/verification/submit');
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
  });

  it('order chat messages index, send, and mark read', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [],
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    await getSellerOrderMessages(77, 10);
    expect(fetchMock.mock.calls[0][0]).toContain('/seller/orders/77/messages?since=10');

    await sendSellerOrderMessage(77, 'Your order is almost ready');
    expect(fetchMock.mock.calls[1][0]).toContain('/seller/orders/77/messages');
    expect(fetchMock.mock.calls[1][1].body).toContain('Your order is almost ready');

    await markSellerOrderMessagesRead(77);
    expect(fetchMock.mock.calls[2][0]).toContain('/seller/orders/77/messages/read');
  });
});
