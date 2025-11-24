import os from "os";

interface LocalIPs {
  ipv4: string[];
  ipv6: string[];
}

export function getLocalIPs(): LocalIPs {
  const interfaces = os.networkInterfaces();
  const result: LocalIPs = { ipv4: [], ipv6: [] };

  if (!interfaces) return result;

  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;

    for (const iface of ifaceList) {
      // Skip internal addresses
      if (iface.internal) continue;

      if (iface.family === "IPv4") {
        result.ipv4.push(iface.address);
      } else if (iface.family === "IPv6") {
        if (!iface.address.startsWith("fe80:")) {
          result.ipv6.push(iface.address);
        }
      }
    }
  }

  return result;
}
