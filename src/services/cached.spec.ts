import { createClient } from "redis";
import { createRedisClient } from "./cached";

jest.mock("redis");
const mocked = jest.mocked;

const mockedCreateClient = mocked(createClient);

describe("createRedisClient Function", () => {
  const redisPort = 6379;
  const redisHost = "127.0.0.1";
  const redisUrl = `redis://${redisHost}:${redisPort}`;
  const cacheKey = "testKey";

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    process.env.REDIS_PORT = redisPort.toString();
    process.env.REDIS_HOST = redisHost;
  });

  it("should create a redis client and get cached data", async () => {
    const mockClient = { get: jest.fn(), set: jest.fn(), connect: jest.fn() };
    const mockData = { key: "value" };
    const cacheKey = "testKey";

    mockedCreateClient.mockReturnValue(mockClient as any);

    const redisClient = await createRedisClient();

    mockClient.get.mockResolvedValue(JSON.stringify(mockData));
    mockClient.set.mockResolvedValue("OK");

    const cachedData = await redisClient.getCachedData(
      cacheKey,
      async () => mockData
    );
    expect(mockedCreateClient).toHaveBeenCalledWith({ url: redisUrl });
    expect(mockClient.get).toHaveBeenCalledWith(cacheKey);
    expect(cachedData).toEqual(mockData);
  });

  it("should create a redis client and set cached data", async () => {
    const mockClient = { get: jest.fn(), set: jest.fn(), connect: jest.fn() };
    const mockData = { key: "value" };

    mockedCreateClient.mockReturnValue(mockClient as any);

    const redisClient = await createRedisClient();

    mockClient.set.mockResolvedValue("OK");

    const cachedData = await redisClient.getCachedData(
      cacheKey,
      async () => mockData
    );
    expect(mockedCreateClient).toHaveBeenCalledWith({ url: redisUrl });
    expect(mockClient.get).toHaveBeenCalledWith(cacheKey);
    expect(mockClient.set).toHaveBeenCalledWith(
      cacheKey,
      JSON.stringify(mockData)
    );
    expect(cachedData).toEqual(mockData);
  });

  it("should return data from callback when Redis is not available", async () => {
    const mockedData = { key: "value" };
    const redisClient = await createRedisClient();
    const callback = jest.fn(async () => mockedData);
    const cachedData = await redisClient.getCachedData(cacheKey, callback);
    expect(callback).toHaveBeenCalled();
    expect(cachedData).toEqual(mockedData);
  });
});
