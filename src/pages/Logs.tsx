import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { useAppStore } from "@/lib/mode";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { LogViewer } from "@/components/LogViewer";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Toggle } from "@/components/Toggle";
import { Badge } from "@/components/Badge";
import {
  Trash2,
  ArrowLeft,
  Download,
  HardDrive,
  Cpu,
  RefreshCw,
  Bug,
} from "lucide-react";
import { useDevMode } from "@/lib/dev-mode";
import { formatBytes } from "@/lib/utils";

interface LogInfo {
  enabled: boolean;
  size: number;
  maxSize: number;
  picoForwarding: boolean;
  debugLogs: boolean;
}

export function Logs() {
  const navigate = useNavigate();
  const clearLogs = useStore((s) => s.clearLogs);
  const devMode = useDevMode();
  const { mode, selectedDeviceId } = useAppStore();

  const [logInfo, setLogInfo] = useState<LogInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [togglingBuffer, setTogglingBuffer] = useState(false);
  const [togglingPico, setTogglingPico] = useState(false);
  const [togglingDebug, setTogglingDebug] = useState(false);

  // Build API URL with device parameter for cloud mode
  const buildApiUrl = useCallback(
    (endpoint: string) => {
      const baseUrl = `/api/logs${endpoint}`;
      if (mode === "cloud" && selectedDeviceId) {
        const separator = endpoint.includes("?") ? "&" : "?";
        return `${baseUrl}${separator}device=${selectedDeviceId}`;
      }
      return baseUrl;
    },
    [mode, selectedDeviceId]
  );

  // Fetch log info from device
  const fetchLogInfo = useCallback(async () => {
    try {
      const url = buildApiUrl("/info");
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLogInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch log info:", error);
    }
  }, [buildApiUrl]);

  useEffect(() => {
    fetchLogInfo();
    // Refresh every 10 seconds
    const interval = setInterval(fetchLogInfo, 10000);
    return () => clearInterval(interval);
  }, [fetchLogInfo]);

  // Enable/disable log buffer
  const toggleLogBuffer = async (enabled: boolean) => {
    try {
      setTogglingBuffer(true);

      const formData = new FormData();
      formData.append("enabled", enabled.toString());

      const url = buildApiUrl("/enable");
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to toggle log buffer:", error);
      }

      await fetchLogInfo();
    } catch (error) {
      console.error("Failed to toggle log buffer:", error);
    } finally {
      setTogglingBuffer(false);
    }
  };

  // Download logs from device
  const downloadLogs = async () => {
    try {
      setDownloading(true);

      const apiUrl = buildApiUrl("");
      const response = await fetch(apiUrl);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `brewos_logs_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error("Failed to download logs:", error);
    } finally {
      setDownloading(false);
    }
  };

  // Clear device logs
  const clearDeviceLogs = async () => {
    try {
      const url = buildApiUrl("");
      await fetch(url, { method: "DELETE" });
      await fetchLogInfo();
    } catch (error) {
      console.error("Failed to clear device logs:", error);
    }
  };

  // Toggle Pico log forwarding
  const togglePicoForwarding = async (enabled: boolean) => {
    try {
      setTogglingPico(true);

      const formData = new FormData();
      formData.append("enabled", enabled.toString());

      const url = buildApiUrl("/pico");
      await fetch(url, {
        method: "POST",
        body: formData,
      });

      await fetchLogInfo();
    } catch (error) {
      console.error("Failed to toggle Pico log forwarding:", error);
    } finally {
      setTogglingPico(false);
    }
  };

  // Toggle debug logs
  const toggleDebugLogs = async (enabled: boolean) => {
    try {
      setTogglingDebug(true);

      const formData = new FormData();
      formData.append("enabled", enabled.toString());

      const url = buildApiUrl("/debug");
      await fetch(url, {
        method: "POST",
        body: formData,
      });

      await fetchLogInfo();
    } catch (error) {
      console.error("Failed to toggle debug logs:", error);
    } finally {
      setTogglingDebug(false);
    }
  };

  const isEnabled = logInfo?.enabled ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <PageHeader
            title="System Logs"
            subtitle="Real-time system events and debug information"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLogInfo}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={clearLogs}>
            <Trash2 className="w-4 h-4" />
            Clear UI
          </Button>
        </div>
      </div>

      {/* Device Log Buffer Card */}
      {devMode && (
        <Card>
          <CardHeader>
            <CardTitle icon={<HardDrive className="w-5 h-5" />}>
              Device Log Buffer
            </CardTitle>
            <Badge variant={isEnabled ? "success" : "default"}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardHeader>

          <div className="space-y-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme">
                  Enable Log Buffer
                </p>
                <p className="text-xs text-theme-muted">
                  Allocates 50KB memory for capturing debug logs
                </p>
              </div>
              <Toggle
                checked={isEnabled}
                onChange={toggleLogBuffer}
                disabled={togglingBuffer}
              />
            </div>

            {isEnabled ? (
              <>
                {/* Buffer Usage */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-theme-muted">Buffer Usage</span>
                  <span className="font-mono">
                    {logInfo
                      ? `${formatBytes(logInfo.size)} / ${formatBytes(
                          logInfo.maxSize
                        )}`
                      : "Loading..."}
                  </span>
                </div>

                {logInfo && (
                  <div className="w-full bg-theme-secondary rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (logInfo.size / logInfo.maxSize) * 100
                        )}%`,
                      }}
                    />
                  </div>
                )}

                <p className="text-xs text-theme-muted">
                  Circular buffer - older entries automatically discarded when
                  full. Download logs before they're overwritten.
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={downloadLogs}
                    disabled={downloading}
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? "Downloading..." : "Download Logs"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={clearDeviceLogs}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Buffer
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-theme-muted">
                Log buffer is disabled. Enable to start capturing ESP32 and Pico
                debug logs. When disabled, there is zero impact on memory or
                performance.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Debug Logs Toggle (dev mode) */}
      {devMode && (
        <Card>
          <CardHeader>
            <CardTitle icon={<Bug className="w-5 h-5" />}>Debug Logs</CardTitle>
            <Badge variant={logInfo?.debugLogs ? "success" : "default"}>
              {logInfo?.debugLogs ? "Enabled" : "Disabled"}
            </Badge>
          </CardHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme">
                  Enable DEBUG Level Logs
                </p>
                <p className="text-xs text-theme-muted">
                  Show DEBUG level logs in addition to INFO, WARN, and ERROR
                </p>
              </div>
              <Toggle
                checked={logInfo?.debugLogs ?? false}
                onChange={toggleDebugLogs}
                disabled={togglingDebug}
              />
            </div>

            <p className="text-xs text-theme-muted">
              When enabled, DEBUG logs are shown in Serial, log buffer, and
              WebSocket. Setting persists across reboots and applies early in
              boot to capture boot logs.
            </p>
          </div>
        </Card>
      )}

      {/* Pico Log Forwarding (only when buffer is enabled) */}
      {devMode && isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle icon={<Cpu className="w-5 h-5" />}>
              Pico Log Forwarding
            </CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme">
                  Forward Pico Logs
                </p>
                <p className="text-xs text-theme-muted">
                  Stream Pico controller logs via UART to device buffer
                </p>
              </div>
              <Toggle
                checked={logInfo?.picoForwarding ?? false}
                onChange={togglePicoForwarding}
                disabled={togglingPico}
              />
            </div>

            <p className="text-xs text-theme-muted">
              Setting persists on Pico until changed. May slightly increase UART
              traffic.
            </p>
          </div>
        </Card>
      )}

      {/* Real-time WebSocket Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Logs</CardTitle>
        </CardHeader>
        <p className="text-xs text-theme-muted mb-4">
          Live system log messages broadcast in real-time via WebSocket.
        </p>
        <div className="h-[calc(100vh-40rem)]">
          <LogViewer maxHeight="h-full" />
        </div>
      </Card>
    </div>
  );
}
