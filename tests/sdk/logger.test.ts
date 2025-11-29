/**
 * Logger Tests using SDK Testing Utilities
 */
import { createMockLogger } from "zuno-marketplace-sdk/testing";

describe("Logger", () => {
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  it("should track debug logs", () => {
    mockLogger.debug("Debug message", { key: "value" });

    expect(mockLogger.calls).toHaveLength(1);
    expect(mockLogger.calls[0]).toEqual({
      level: "debug",
      message: "Debug message",
      meta: { key: "value" },
    });
  });

  it("should track info logs", () => {
    mockLogger.info("Info message");

    expect(mockLogger.calls).toHaveLength(1);
    expect(mockLogger.calls[0].level).toBe("info");
    expect(mockLogger.calls[0].message).toBe("Info message");
  });

  it("should track warn logs", () => {
    mockLogger.warn("Warning message", { code: "WARN_001" });

    expect(mockLogger.calls).toHaveLength(1);
    expect(mockLogger.calls[0].level).toBe("warn");
  });

  it("should track error logs", () => {
    mockLogger.error("Error message", { error: new Error("Test error") });

    expect(mockLogger.calls).toHaveLength(1);
    expect(mockLogger.calls[0].level).toBe("error");
  });

  it("should track multiple logs in order", () => {
    mockLogger.info("First");
    mockLogger.debug("Second");
    mockLogger.error("Third");

    expect(mockLogger.calls).toHaveLength(3);
    expect(mockLogger.calls[0].message).toBe("First");
    expect(mockLogger.calls[1].message).toBe("Second");
    expect(mockLogger.calls[2].message).toBe("Third");
  });

  it("should filter logs by level", () => {
    mockLogger.debug("Debug");
    mockLogger.info("Info");
    mockLogger.error("Error");

    const errorLogs = mockLogger.calls.filter((log) => log.level === "error");

    expect(errorLogs).toHaveLength(1);
    expect(errorLogs[0].message).toBe("Error");
  });
});
