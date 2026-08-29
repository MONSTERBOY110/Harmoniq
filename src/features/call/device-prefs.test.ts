import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_DEVICE_PREFS, loadDevicePrefs, saveDevicePrefs } from "./device-prefs";

describe("device prefs", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns defaults when nothing is stored", () => {
    expect(loadDevicePrefs()).toEqual(DEFAULT_DEVICE_PREFS);
  });

  it("round-trips saved preferences", () => {
    saveDevicePrefs({ cameraId: "cam-1", micId: "mic-2", camOn: false, micOn: true });
    expect(loadDevicePrefs()).toEqual({ cameraId: "cam-1", micId: "mic-2", camOn: false, micOn: true });
  });

  it("ignores corrupt storage", () => {
    window.localStorage.setItem("harmoniq.devices", "{not json");
    expect(loadDevicePrefs()).toEqual(DEFAULT_DEVICE_PREFS);
  });

  it("merges partial updates over defaults", () => {
    saveDevicePrefs({ micOn: false });
    expect(loadDevicePrefs()).toEqual({ ...DEFAULT_DEVICE_PREFS, micOn: false });
  });
});
