import { getHomeShops } from '../browse';

const originalFetch = globalThis.fetch;

describe('Browse API - Home Request Parameters', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends sector and near_area query parameters on the home request', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [],
        message: 'Shops retrieved successfully.',
        meta: { current_page: 1, last_page: 1, total: 0 },
      }),
    });
    globalThis.fetch = fetchMock;

    await getHomeShops({
      sector: '4A',
      near_area: 'Ghabra Mor',
      category_id: 2,
      page: 1,
      per_page: 15,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as string;

    expect(calledUrl).toContain('/customer/home?');
    expect(calledUrl).toContain('sector=4A');
    expect(calledUrl).toContain('near_area=Ghabra+Mor');
    expect(calledUrl).toContain('category_id=2');
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('per_page=15');
  });
});
