// src/utils/intercept-console.ts
type ConsoleMethod = "log" | "warn" | "error" | "info" | "debug";

// Lưu bản gốc
const originalConsole: Record<ConsoleMethod, (...args: any[]) => void> = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

// Các pattern log mặc định cần loại bỏ
const IGNORED_PATTERNS = [
  "react-dom-client",
  "turbopack-hot-reloader",
  "Fast Refresh",
  "scheduler.development.js",
  "react-server-dom-turbopack-client",
  "app-bootstrap.ts",
  "dev-base.ts",
  "runtime-backend-dom.ts",
  "common-1.js",
  "MetaMask - RPC Error",
  "inpage.js",
  "Understand this",
  "react_stack_bottom_frame",
  "performWorkOnRoot",
  "flushSyncWorkAcrossRoots_impl",
  "processRootScheduleInMicrotask",
  "executeDispatch",
  "runWithFiberInDEV",
  "processDispatchQueue",
  "batchedUpdates$1",
  "dispatchEventForPluginEventSystem",
  "dispatchEvent",
  "dispatchDiscreteEvent",
  "react-jsx-dev-runtime",
  "renderWithHooksAgain",
  "renderWithHooks",
  "updateFunctionComponent",
  "beginWork",
  "performUnitOfWork",
  "workLoopSync",
  "renderRootSync",
  "performSyncWorkOnRoot",
  "performWorkOnRootViaSchedulerTask",
  "performWorkUntilDeadline",
  "initializeElement",
  "initializeModelChunk",
  "getOutlinedModel",
  "parseModelString",
  "resolveModelChunk",
  "processFullStringRow",
  "processFullBinaryRow",
  "processBinaryChunk",
  "initializeFakeTask",
  "initializeDebugInfo",
  "initializeDebugChunk",
  "ResponseInstance",
  "createResponseFromOptions",
  "createFromReadableStream",
  "__TURBOPACK__module__evaluation__",
  "runModuleExecutionHooks",
  "instantiateModule",
  "getOrInstantiateModuleFromParent",
  "commonJsRequire",
  "getOrInstantiateRuntimeModule",
  "registerChunk",
  "loadScriptsInSequence",
  "appBootstrap",
  "app-bootstrap",
  "app-next-turbopack",
  "dev-backend-dom",
  "runtime-utils",
  "app-index.tsx",
  "Function.all @ VM",
];

// Hàm kiểm tra log có nên ẩn không
function shouldIgnore(args: any[]): boolean {
  return args.some(
    (a) => typeof a === "string" && IGNORED_PATTERNS.some((p) => a.includes(p))
  );
}

// Ghi đè console method
(["log", "warn", "error", "info", "debug"] as ConsoleMethod[]).forEach(
  (method) => {

    console[method] = (...args: any[]) => {
      if (shouldIgnore(args)) return;
      // Nếu log có emoji (log custom) => hiển thị rõ ràng
      if (
        args.some((a) => typeof a === "string" && /[🎯💰🚀✅❌🔧📊🔍]/.test(a))
      ) {
        originalConsole[method](`[${method.toUpperCase()}]`, ...args);
        return;
      }
      // Log ngắn, có file code của bạn => giữ lại
      if (
        args.some(
          (a) => typeof a === "string" && a.includes("CollectionService.ts")
        )
      ) {
        originalConsole[method](`[${method.toUpperCase()}]`, ...args);
        return;
      }
      // Ẩn còn lại
    };
  }
);

originalConsole.log(
  "✅ Console interception active (Next.js dev logs cleaned)"
);
