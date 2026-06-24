import { jest } from "@jest/globals";

const mockConnect = jest.fn();
const mockOn = jest.fn();

jest.unstable_mockModule("mongoose", () => ({
  default: { connect: mockConnect, connection: { on: mockOn } },
}));

const { connectDB } = await import("../config/db.js");

describe("connectDB", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("connects on the first attempt", async () => {
    mockConnect.mockResolvedValueOnce(undefined);
    await connectDB();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("retries with backoff instead of throwing/exiting, then connects", async () => {
    jest.useFakeTimers();
    mockConnect
      .mockRejectedValueOnce(new Error("ReplicaSetNoPrimary"))
      .mockResolvedValueOnce(undefined);

    const done = connectDB();
    // Let the first (rejected) attempt settle, then advance past the retry delay.
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(5000);
    await done;

    expect(mockConnect).toHaveBeenCalledTimes(2);
  });
});
