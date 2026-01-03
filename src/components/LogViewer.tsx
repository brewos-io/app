import { useStore } from "@/lib/store";
import { formatTime } from "@/lib/date";

interface LogViewerProps {
  maxHeight?: string;
}

function getLogColor(level: string): string {
  switch (level.toLowerCase()) {
    case "error":
      return "text-red-400";
    case "warn":
    case "warning":
      return "text-amber-400";
    case "info":
      return "text-blue-400";
    case "debug":
      return "text-theme-muted";
    default:
      return "text-theme-secondary";
  }
}

export function LogViewer({ maxHeight = "max-h-64" }: LogViewerProps) {
  const logs = useStore((s) => s.logs);
  const connectionState = useStore((s) => s.connectionState);

  // If maxHeight is "h-full", use full height; otherwise use max-height
  const heightClass = maxHeight === "h-full" ? "h-full" : maxHeight;

  return (
    <div
      className={`${heightClass} overflow-y-auto bg-theme-secondary rounded-xl p-4 font-mono text-xs`}
    >
      {logs.length > 0 ? (
        logs.map((log) => (
          <div
            key={log.id}
            className="py-1 border-b border-theme last:border-0"
          >
            <span className="text-theme-muted">{formatTime(log.time)}</span>
            <span className={`ml-2 ${getLogColor(log.level)}`}>
              [{log.level.toUpperCase()}]
            </span>
            {log.source && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                log.source === "pico" 
                  ? "bg-purple-500/20 text-purple-300" 
                  : "bg-blue-500/20 text-blue-300"
              }`}>
                {log.source.toUpperCase()}
              </span>
            )}
            <span className="text-theme ml-2">{log.message}</span>
          </div>
        ))
      ) : (
        <div className="text-theme-muted text-center py-8 space-y-2">
          <p className="font-medium">No logs available</p>
          {connectionState !== "connected" && (
            <p className="text-xs text-amber-400">
              ⚠️ Device not connected (status: {connectionState})
            </p>
          )}
          <p className="text-xs">
            Logs appear here when system events occur (WiFi connection, temperature changes, brewing events, etc.)
          </p>
          <p className="text-xs">
            {connectionState === "connected"
              ? "Try triggering an event (e.g., change temperature, connect/disconnect WiFi) to see logs"
              : "Ensure your device is connected to see logs"}
          </p>
        </div>
      )}
    </div>
  );
}
