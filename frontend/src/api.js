const API_BASE = import.meta.env.VITE_POWERSHIELD_API || 'http://localhost:5001';

async function handleResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
  }
  return response.json();
}

export const powerApi = {
  async overview() {
    const res = await fetch(`${API_BASE}/api/overview`);
    return handleResponse(res);
  },

  async events() {
    const res = await fetch(`${API_BASE}/api/events`);
    return handleResponse(res);
  },

  async devices() {
    const res = await fetch(`${API_BASE}/api/devices`);
    return handleResponse(res);
  },

  async stats() {
    const res = await fetch(`${API_BASE}/api/stats`);
    return handleResponse(res);
  },

  async simulateAttack(deviceId, voltageKv) {
    const res = await fetch(`${API_BASE}/api/simulate-attack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: deviceId,
        voltage_kv: Number(voltageKv),
      }),
    });
    return handleResponse(res);
  },
};

// Aliases matching your component expectations
export const getDevices = powerApi.devices;
export const getAlerts = powerApi.events;
export const getStats = powerApi.overview;
export const simulateFalseDataInjection = powerApi.simulateAttack;