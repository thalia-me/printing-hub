'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Camera, 
  QrCode, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Eye, 
  LogOut, 
  Zap,
  TrendingUp,
  ExternalLink,
  HardDrive,
  AlertTriangle
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { playNotificationChime } from '@/lib/audioNotification';
import CounterQrScanner from '@/components/admin/CounterQrScanner';
import StorePosterModal from '@/components/admin/StorePosterModal';
import OrderDetailModal from '@/components/admin/OrderDetailModal';
import StorageModal from '@/components/admin/StorageModal';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Audio & Notification State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const prevOrderCountRef = useRef<number>(0);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [scannerOpen, setScannerOpen] = useState(false);
  const [posterOpen, setPosterOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [storageOpen, setStorageOpen] = useState(false);

  // Storage Health State
  const [storageWarning, setStorageWarning] = useState(false);
  const [storageUsagePercent, setStorageUsagePercent] = useState<number | null>(null);
  const [storageUsedMB, setStorageUsedMB] = useState<number | null>(null);

  useEffect(() => {
    // Middleware verifies the server-side session before rendering this page
    setIsAuthenticated(true);
    setAuthChecked(true);
  }, []);

  const checkStorage = async () => {
    try {
      const res = await fetch('/api/admin/storage');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.storage) {
          setStorageWarning(Boolean(data.storage.isWarning));
          setStorageUsagePercent(data.storage.usedPercent);
          setStorageUsedMB(data.storage.usedMB);
        }
      }
    } catch (err) {
      // Non-blocking storage health check
    }
  };

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      const res = await fetch('/api/orders');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();

      if (data.success && Array.isArray(data.orders)) {
        if (prevOrderCountRef.current > 0 && data.orders.length > prevOrderCountRef.current) {
          const newest = data.orders[0];
          if (soundEnabled) {
            playNotificationChime();
          }
          setNewOrderAlert(`🔔 New Order from ${newest.customerName} (${newest.orderNumber})`);
          setTimeout(() => setNewOrderAlert(null), 8000);
        }

        prevOrderCountRef.current = data.orders.length;
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchOrders(false);
    checkStorage();

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('print_orders_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_ORDER') {
            const newOrd = event.data.order;
            if (soundEnabled) {
              playNotificationChime();
            }
            setNewOrderAlert(`🔔 New Order: ${newOrd.customerName} - ${newOrd.orderNumber}`);
            setTimeout(() => setNewOrderAlert(null), 8000);
            fetchOrders(true);
          }
        };
      } catch (e) {}
    }

    const interval = setInterval(() => {
      fetchOrders(true);
    }, 4000);

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [isAuthenticated, soundEnabled]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? data.order : o))
        );
        if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderNumber === orderId)) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setSelectedOrder(null);
      }
    } catch (err) {
      alert('Failed to delete order');
    }
  };

  const handleScanSuccess = async (scannedInput: string) => {
    setScannerOpen(false);
    if (!scannedInput.trim()) return;

    try {
      const res = await fetch(`/api/admin/orders/lookup?query=${encodeURIComponent(scannedInput.trim())}`);
      const data = await res.json();

      if (res.ok && data.success && data.order) {
        setSelectedOrder(data.order);
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === data.order.id);
          if (exists) {
            return prev.map((o) => (o.id === data.order.id ? data.order : o));
          }
          return [data.order, ...prev];
        });
      } else {
        alert(data.error || `Order not found for: ${scannedInput}`);
      }
    } catch {
      alert(`Lookup failed for: ${scannedInput}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    router.push('/admin/login');
    router.refresh();
  };

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-clay-milk/40 border-t-clay-milk rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesService = serviceFilter === 'ALL' || order.serviceType === serviceFilter;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    return matchesStatus && matchesService && matchesSearch;
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const printingCount = orders.filter((o) => o.status === 'PRINTING').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {newOrderAlert && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 p-4 rounded-3xl bg-clay-wine text-clay-milk font-serif font-bold text-sm shadow-2xl flex items-center gap-3 animate-bounce-subtle border-2 border-clay-pink">
          <Bell className="w-5 h-5 text-clay-mustard animate-spin" />
          <span>{newOrderAlert}</span>
        </div>
      )}

      {/* Top Bar with Dxlea Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-4xl bg-clay-milk border border-clay-paper shadow-clay">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-clay-pink shadow-sm bg-white flex-shrink-0">
            <Image
              src="/images/logo.jpg"
              alt="Dxlea Logo"
              fill
              className="object-contain p-0.5"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-black text-xl text-clay-wine tracking-tight">
                Dxlea Admin Station
              </h1>
              <span className="w-2.5 h-2.5 rounded-full bg-clay-mustard animate-pulse" title="Live Terminal Active"></span>
            </div>
            <p className="text-xs text-clay-brown-muted">Live incoming queue & counter scanning</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playNotificationChime();
            }}
            className={`p-2.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-clay-mustard-light border-clay-mustard text-clay-brown'
                : 'bg-clay-paper border-clay-paper text-clay-brown-muted'
            }`}
            title={soundEnabled ? 'Chime ON' : 'Chime Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-clay-terracotta" /> : <VolumeX className="w-4 h-4 text-clay-brown-muted" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <button
            onClick={() => playNotificationChime()}
            className="p-2.5 rounded-full bg-clay-paper hover:bg-clay-cream text-clay-brown text-xs font-bold"
            title="Test notification chime sound"
          >
            <Bell className="w-4 h-4 text-clay-terracotta" />
          </button>

          <button
            onClick={() => setScannerOpen(true)}
            className="px-4 py-2.5 rounded-full bg-clay-wine hover:bg-clay-wine-dark text-xs font-serif font-bold text-clay-milk flex items-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4 text-clay-pink" />
            <span>Scan Customer QR</span>
          </button>

          <button
            onClick={() => setPosterOpen(true)}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-clay-paper hover:bg-clay-cream text-xs font-serif font-bold text-clay-wine flex items-center gap-2"
          >
            <QrCode className="w-4 h-4 text-clay-terracotta" />
            <span className="hidden sm:inline">Storefront Poster</span>
          </button>

          <button
            onClick={() => setStorageOpen(true)}
            className={`p-2.5 sm:px-4 sm:py-2.5 rounded-full text-xs font-serif font-bold flex items-center gap-2 transition-all relative ${
              storageWarning
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-clay-paper hover:bg-clay-cream text-clay-brown'
            }`}
            title={storageWarning ? `Storage Warning: ${storageUsagePercent}% used` : 'Supabase Storage Usage'}
          >
            <HardDrive className={`w-4 h-4 ${storageWarning ? 'text-amber-700 animate-pulse' : 'text-clay-terracotta'}`} />
            <span className="hidden sm:inline">Storage</span>
            {storageUsagePercent !== null && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                storageWarning ? 'bg-amber-500 text-white font-bold' : 'bg-clay-milk text-clay-brown-muted'
              }`}>
                {storageUsagePercent}%
              </span>
            )}
            {storageWarning && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-full bg-clay-paper hover:bg-clay-cream text-xs font-serif font-bold text-clay-brown flex items-center gap-1.5 transition-colors"
            title="Open customer order page in a new tab"
          >
            <ExternalLink className="w-4 h-4 text-clay-terracotta" />
            <span className="hidden sm:inline">Customer Store</span>
          </a>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-full bg-clay-paper hover:bg-rose-100 hover:text-rose-700 text-clay-brown-muted transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Storage Warning Banner */}
      {storageWarning && (
        <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <p className="font-serif font-black text-sm text-amber-900">
                Supabase Storage Warning: {storageUsagePercent}% Used ({storageUsedMB} MB / 1,000 MB)
              </p>
              <p className="text-xs text-amber-800">
                Free tier limit (1 GB) is approaching. Clean up old completed/cancelled order files to prevent upload failures.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStorageOpen(true)}
            className="px-4 py-2 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-serif font-bold text-xs shadow-sm self-start sm:self-auto transition-colors"
          >
            Manage & Clean Up
          </button>
        </div>
      )}

      {/* Metrics Row styled like cozy clay cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-clay-milk p-4 rounded-3xl border border-clay-paper shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-clay-brown-muted font-serif">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-clay-mustard" />
          </div>
          <p className="text-2xl font-black text-clay-terracotta font-mono">{pendingCount}</p>
          <p className="text-[10px] text-clay-brown-muted">Requires print prep</p>
        </div>

        <div className="bg-clay-milk p-4 rounded-3xl border border-clay-paper shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-clay-brown-muted font-serif">
            <span>In Printing</span>
            <Printer className="w-4 h-4 text-clay-wine" />
          </div>
          <p className="text-2xl font-black text-clay-wine font-mono">{printingCount}</p>
          <p className="text-[10px] text-clay-brown-muted">In production</p>
        </div>

        <div className="bg-clay-milk p-4 rounded-3xl border border-clay-paper shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-clay-brown-muted font-serif">
            <span>Ready for Claim</span>
            <CheckCircle2 className="w-4 h-4 text-clay-sage" />
          </div>
          <p className="text-2xl font-black text-clay-sage-dark font-mono">{readyCount}</p>
          <p className="text-[10px] text-clay-brown-muted">Packaged at counter</p>
        </div>

        <div className="bg-clay-milk p-4 rounded-3xl border border-clay-paper shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-clay-brown-muted font-serif">
            <span>Queued Orders Value</span>
            <TrendingUp className="w-4 h-4 text-clay-terracotta" />
          </div>
          <p className="text-2xl font-black text-clay-brown font-mono">₱{totalRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-clay-brown-muted">{orders.length} total jobs</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-clay-milk p-4 rounded-3xl border border-clay-paper shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-clay-brown-muted absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Order #, Customer Name, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-clay-cream border border-clay-paper rounded-full pl-9 pr-3.5 py-2 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner font-medium"
            />
          </div>

          <button
            onClick={() => fetchOrders(false)}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-full bg-clay-paper hover:bg-clay-cream text-xs font-serif font-bold text-clay-brown flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          {['ALL', 'PENDING', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED'].map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-full font-serif font-bold transition-all whitespace-nowrap text-xs ${
                  active
                    ? 'bg-clay-wine text-clay-milk shadow-sm'
                    : 'bg-clay-cream text-clay-brown hover:bg-clay-paper border border-clay-paper'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-clay-milk rounded-4xl border border-clay-paper overflow-hidden shadow-clay">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-clay-cream text-clay-wine font-serif font-bold border-b border-clay-paper uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Order Code</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Files / Specs</th>
                <th className="py-3.5 px-4">Target Time</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clay-paper">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-clay-brown-muted font-serif">
                    No orders found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-clay-cream/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-clay-wine">
                      <div className="flex items-center gap-1.5">
                        <span>{order.orderNumber}</span>
                        {order.isRush && (
                          <span className="p-1 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard" title="Rush order">
                            <Zap className="w-3 h-3 text-clay-terracotta" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-serif font-bold text-clay-brown">{order.customerName}</p>
                      <p className="text-[10px] text-clay-brown-muted font-mono">{order.customerPhone}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-clay-paper text-clay-wine text-[10px] font-bold uppercase">
                        {order.serviceType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-clay-brown line-clamp-1 font-medium">
                        {order.items[0]?.title || 'Custom Job'}
                      </p>
                      <p className="text-[10px] text-clay-brown-muted">
                        {order.files.length} file(s) attached
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-clay-brown">
                      {order.pickupTime?.includes('Walk-in') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-clay-terracotta/15 text-clay-terracotta text-xs font-bold whitespace-nowrap">
                          🚶 Walk-in
                        </span>
                      ) : (
                        <span className="text-clay-brown-muted text-xs">{order.pickupTime || 'Standard'}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-clay-wine">
                      ₱{order.totalPrice.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-block ${
                        order.status === 'READY'
                          ? 'bg-clay-sage/30 text-clay-sage-dark border border-clay-sage animate-pulse'
                          : order.status === 'PRINTING'
                          ? 'bg-clay-mustard-light text-clay-terracotta border border-clay-mustard'
                          : order.status === 'COMPLETED'
                          ? 'bg-clay-paper text-clay-brown'
                          : order.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-clay-pink/30 text-clay-wine border border-clay-pink'
                      }`}>
                        {order.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'PRINTING')}
                            className="px-3 py-1 rounded-full bg-clay-terracotta text-clay-milk text-[10px] font-bold hover:opacity-90"
                          >
                            Print
                          </button>
                        )}
                        {order.status === 'PRINTING' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'READY')}
                            className="px-3 py-1 rounded-full bg-clay-sage text-clay-milk text-[10px] font-bold hover:opacity-90"
                          >
                            Ready
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                            className="px-3 py-1 rounded-full bg-clay-brown text-clay-milk text-[10px] font-bold hover:opacity-90"
                          >
                            Claimed
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-full bg-clay-paper hover:bg-clay-cream text-clay-brown"
                          title="View order"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CounterQrScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      <StorePosterModal
        isOpen={posterOpen}
        onClose={() => setPosterOpen(false)}
      />

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdate={handleStatusUpdate}
        onDelete={handleDeleteOrder}
      />

      <StorageModal
        isOpen={storageOpen}
        onClose={() => setStorageOpen(false)}
        onCleanupComplete={() => {
          fetchOrders(true);
          checkStorage();
        }}
      />
    </div>
  );
}
