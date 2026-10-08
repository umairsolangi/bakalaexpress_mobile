import {
  getCustomerNotifications,
  markCustomerNotificationsRead,
  getSellerNotifications,
  markSellerNotificationsRead,
  registerDeviceToken,
  deleteDeviceToken,
} from '../notifications';

const originalFetch = globalThis.fetch;

describe('Notifications & Device Token API', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('getCustomerNotifications calls GET /customer/notifications', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'uuid-1',
            type: 'order_status',
            title: 'Order Confirmed',
            body: 'Shop has confirmed order #42',
            order_id: '42',
            read_at: null,
          },
        ],
        meta: { unread_count: 1 },
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    const res = await getCustomerNotifications(1, 20);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/customer/notifications?page=1&per_page=20');
    expect(res.data[0].id).toBe('uuid-1');
  });

  it('markCustomerNotificationsRead sends POST /customer/notifications/read', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { unread_count: 0 },
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    await markCustomerNotificationsRead({ all: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/customer/notifications/read');
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
  });

  it('getSellerNotifications calls GET /seller/notifications', async () => {
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

    await getSellerNotifications(1, 20);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/seller/notifications?page=1&per_page=20');
  });

  it('markSellerNotificationsRead sends POST /seller/notifications/read', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { unread_count: 0 },
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    await markSellerNotificationsRead({ ids: ['uuid-99'] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/seller/notifications/read');
    expect(fetchMock.mock.calls[0][1].body).toContain('uuid-99');
  });

  it('registerDeviceToken and deleteDeviceToken endpoints', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {},
        message: 'Success',
      }),
    });
    globalThis.fetch = fetchMock;

    await registerDeviceToken('customer', {
      expo_push_token: 'ExponentPushToken[xyz]',
      platform: 'android',
    });
    expect(fetchMock.mock.calls[0][0]).toContain('/customer/devices');
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');

    await deleteDeviceToken('rider', 'ExponentPushToken[xyz]');
    expect(fetchMock.mock.calls[1][0]).toContain('/rider/devices');
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
  });
});
