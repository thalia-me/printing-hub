import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  // In production, disable local network IP detection
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  // Development only: helper for testing from phone on the same local Wi-Fi
  const interfaces = os.networkInterfaces();
  let detectedIp = '127.0.0.1';

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.')) {
          detectedIp = iface.address;
          break;
        } else if (detectedIp === '127.0.0.1') {
          detectedIp = iface.address;
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    ip: detectedIp,
    url: `http://${detectedIp}:3000`,
  });
}
