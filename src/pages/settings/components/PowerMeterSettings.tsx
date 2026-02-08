import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useCommand } from "@/lib/useCommand";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import {
  Activity,
  Settings,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Loader2,
  Clock,
} from "lucide-react";
import { PowerMeterStatus } from "./PowerMeterStatus";

interface TestStep {
  name: string;
  ok: boolean;
  detail: string;
}

interface TestResult {
  success: boolean;
  message: string;
  steps?: TestStep[];
}

type PowerSource = "none" | "mqtt";

interface PowerMeterConfig extends Record<string, unknown> {
  source: PowerSource;
  topic?: string;
  format?: string;
}

export function PowerMeterSettings() {
  const powerMeter = useStore((s) => s.power.meter);
  const { sendCommand } = useCommand();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Configuration state
  const [source, setSource] = useState<PowerSource>("none");
  const [mqttTopic, setMqttTopic] = useState<string>("");
  const [mqttFormat, setMqttFormat] = useState<string>("auto");
  const [initializedFromStore, setInitializedFromStore] = useState(false);

  // Test state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Initialize from store (only once when entering edit mode)
  useEffect(() => {
    if (powerMeter && !editing && !initializedFromStore) {
      // Map any legacy "hardware" source to "none" since hardware metering was removed
      const currentSource = powerMeter.source === "mqtt" ? "mqtt" : "none";
      setSource(currentSource);
      // Restore MQTT config from store (so settings survive page refresh)
      if (powerMeter.mqttTopic) {
        setMqttTopic(powerMeter.mqttTopic);
      }
      if (powerMeter.mqttFormat) {
        setMqttFormat(powerMeter.mqttFormat);
      }
      setInitializedFromStore(true);
    }
  }, [powerMeter, editing, initializedFromStore]);

  // Reset initialization flag when exiting edit mode
  useEffect(() => {
    if (!editing) {
      setInitializedFromStore(false);
      setTestResult(null);
    }
  }, [editing]);

  // Listen for power meter test results
  useEffect(() => {
    const handleTestResult = (event: CustomEvent<TestResult>) => {
      setTesting(false);
      setTestResult(event.detail);
    };

    window.addEventListener(
      "power_meter_test_result",
      handleTestResult as EventListener
    );
    return () =>
      window.removeEventListener(
        "power_meter_test_result",
        handleTestResult as EventListener
      );
  }, []);

  const handleSave = async () => {
    setSaving(true);

    const config: PowerMeterConfig = {
      source: source,
    };

    if (source === "mqtt") {
      config.topic = mqttTopic;
      config.format = mqttFormat;
    }

    sendCommand("configure_power_meter", config, {
      successMessage: "Power meter configuration saved",
    });

    // Brief visual feedback
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
    }, 600);
  };

  const handleTestMqtt = () => {
    if (testing || !mqttTopic) return;
    setTesting(true);
    setTestResult(null);
    sendCommand("test_power_meter", {
      topic: mqttTopic,
      format: mqttFormat,
    });
    // Timeout fallback (test waits up to 15s on ESP + network latency)
    setTimeout(() => setTesting(false), 20000);
  };

  const handleCancel = () => {
    // Reset to current values
    if (powerMeter) {
      const currentSource = powerMeter.source === "mqtt" ? "mqtt" : "none";
      setSource(currentSource);
    } else {
      setSource("none");
    }
    setEditing(false);
  };

  const hasChanges =
    powerMeter?.source !== source ||
    (source === "mqtt" && mqttTopic.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle icon={<Activity className="w-5 h-5" />}>
          Power Metering
        </CardTitle>
      </CardHeader>

      {!editing ? (
        /* View mode */
        <div className="space-y-0">
          <div className="flex items-center justify-between py-2 border-b border-theme">
            <span className="text-sm text-theme-muted">Source</span>
            <span className="text-sm font-medium text-theme capitalize">
              {powerMeter?.source === "mqtt" && "MQTT Smart Plug"}
              {(!powerMeter || powerMeter?.source === "none" || powerMeter?.source !== "mqtt") && "None"}
            </span>
          </div>

          {powerMeter?.source === "mqtt" && (
            <div className="flex items-center justify-between py-2 border-b border-theme">
              <span className="text-sm text-theme-muted">MQTT Topic</span>
              <span className="text-sm font-medium text-theme truncate max-w-[200px]">
                {powerMeter?.mqttTopic || mqttTopic || "Not configured"}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-2 border-b border-theme">
            <span className="text-sm text-theme-muted">Status</span>
            <div className="flex items-center gap-2">
              {powerMeter?.connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">
                    Connected
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-theme-muted" />
                  <span className="text-sm font-medium text-theme-muted">
                    {powerMeter?.source === "none" || !powerMeter
                      ? "Disabled"
                      : "Disconnected"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Show current readings if connected */}
          {powerMeter?.connected && powerMeter?.reading && <PowerMeterStatus />}

          <button
            onClick={() => setEditing(true)}
            className="w-full flex items-center justify-between py-2.5 border-t border-theme text-left group transition-colors hover:opacity-80 mt-2"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-theme-muted" />
              <span className="text-sm font-medium text-theme">
                Configure Power Metering
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-theme-muted group-hover:text-theme transition-colors" />
          </button>
        </div>
      ) : (
        /* Edit mode */
        <div className="space-y-4">
          <p className="text-sm text-theme-muted">
            Monitor machine power consumption via an MQTT smart plug (Shelly, Tasmota, etc.).
          </p>

          {/* Source Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-theme-muted">
              Power Meter Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as PowerSource)}
              className="input"
            >
              <option value="none">None (Disabled)</option>
              <option value="mqtt">MQTT Smart Plug</option>
            </select>
          </div>

          {/* MQTT Configuration */}
          {source === "mqtt" && (
            <div className="space-y-3">
              <Input
                label="MQTT Topic"
                type="text"
                value={mqttTopic}
                onChange={(e) => setMqttTopic(e.target.value)}
                placeholder="shellies/shelly-plug-XXX/status"
                hint="Full MQTT topic path that publishes power data"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  Data Format
                </label>
                <select
                  value={mqttFormat}
                  onChange={(e) => setMqttFormat(e.target.value)}
                  className="input"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="shelly">Shelly Plug</option>
                  <option value="tasmota">Tasmota (SENSOR)</option>
                  <option value="generic">Generic JSON</option>
                </select>
              </div>

              <Button
                variant="secondary"
                onClick={handleTestMqtt}
                disabled={testing || !mqttTopic}
                className="w-full"
              >
                {testing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing... (up to 15s)
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Test Connection
                  </span>
                )}
              </Button>

              {/* Test Results */}
              {testResult && (() => {
                // Determine result state: success (green), waiting (amber), or failed (red)
                const isWaiting =
                  !testResult.success &&
                  testResult.steps?.some((s) => s.name === "Subscribed" && s.ok);
                const colorClass = testResult.success
                  ? "bg-green-500/10 border-green-500/20"
                  : isWaiting
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-red-500/10 border-red-500/20";
                const textClass = testResult.success
                  ? "text-green-500"
                  : isWaiting
                    ? "text-amber-500"
                    : "text-red-500";

                return (
                  <div className={`p-3 rounded-lg border space-y-2 ${colorClass}`}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : isWaiting ? (
                        <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${textClass}`}>
                        {testResult.message}
                      </span>
                    </div>

                    {testResult.steps && testResult.steps.length > 0 && (
                      <div className="space-y-1 ml-6">
                        {testResult.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            {step.ok ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <span className="font-medium text-theme">
                                {step.name}:
                              </span>{" "}
                              <span className="text-theme-muted">
                                {step.detail}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isWaiting && (
                      <p className="text-xs text-amber-500/80 ml-6">
                        Tasmota default TelePeriod is 300s. Try running{" "}
                        <code className="bg-amber-500/10 px-1 rounded">TelePeriod 10</code>{" "}
                        in the Tasmota console to speed it up.
                      </p>
                    )}
                  </div>
                );
              })()}

              <p className="text-xs text-theme-muted">
                Supports Shelly Plug, Tasmota-flashed smart plugs, and generic
                JSON formats. MQTT must be enabled in Network settings.
              </p>
            </div>
          )}

          {source === "none" && (
            <div className="p-3 rounded-lg bg-theme-muted/10">
              <p className="text-sm text-theme-muted">
                Power metering disabled. Energy consumption will not be tracked.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={saving || !hasChanges}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
