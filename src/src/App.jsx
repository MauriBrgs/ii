import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Package, 
  Truck, 
  Store, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Minus, 
  RefreshCw, 
  Calculator, 
  Send,
  Zap,
  RotateCcw,
  PlusCircle,
  X,
  Printer,
  Sliders,
  DollarSign,
  TrendingUp,
  Search,
  Check,
  Building2,
  Trash2
} from 'lucide-react';

// Catálogo inicial por defecto
const DEFAULT_PRODUCTS = [
  { id: 'gaseosa_500', name: 'Gaseosa (Fardo)', category: 'Bebidas', price: 2500, initialStock: 48, minThreshold: 10 },
  { id: 'cerveza_lata', name: 'Cerveza en Lata 473ml', category: 'Bebidas', price: 3000, initialStock: 72, minThreshold: 15 },
  { id: 'pancho_completo', name: 'Pancho Completo', category: 'Comida', price: 2000, initialStock: 50, minThreshold: 12 },
  { id: 'chicles_pack', name: 'Caja de Chicles', category: 'Golosinas', price: 800, initialStock: 30, minThreshold: 5 },
  { id: 'semillitas', name: 'Semillitas de Girasol', category: 'Golosinas', price: 1000, initialStock: 40, minThreshold: 8 },
  { id: 'galletas_pack', name: 'Pack Galletitas', category: 'Golosinas', price: 1200, initialStock: 25, minThreshold: 5 },
];

// Locales predeterminados del estadio
const DEFAULT_STANDS = [
  { id: 'stand_1', name: 'Puesto Tribuna Norte #1', location: 'Tribuna Norte' },
  { id: 'stand_2', name: 'Puesto Platea Alta #2', location: 'Platea Alta' },
  { id: 'stand_3', name: 'Puesto Popular Sur #3', location: 'Popular Sur' },
];

export default function App() {
  // Estados Principales
  const [role, setRole] = useState('stand'); // 'stand' (Vendedor) | 'warehouse' (Depósito)
  const [stands, setStands] = useState(() => {
    const saved = localStorage.getItem('stadium_stands');
    return saved ? JSON.parse(saved) : DEFAULT_STANDS;
  });
  const [selectedStandId, setSelectedStandId] = useState(() => stands[0]?.id || 'stand_1');
  
  const [productsCatalog, setProductsCatalog] = useState(() => {
    const saved = localStorage.getItem('stadium_catalog');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  // Inventario multi-local: { [standId_productId]: { currentStock, initialStock, receivedReplenishments, ... } }
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('stadium_inventory');
    if (saved) return JSON.parse(saved);
    
    // Inicializar con locales e inventario por defecto
    const initialMap = {};
    DEFAULT_STANDS.forEach(stand => {
      DEFAULT_PRODUCTS.forEach(prod => {
        initialMap[`${stand.id}_${prod.id}`] = {
          standId: stand.id,
          productId: prod.id,
          name: prod.name,
          category: prod.category,
          price: prod.price,
          initialStock: prod.initialStock,
          currentStock: prod.initialStock,
          receivedReplenishments: 0,
          minThreshold: prod.minThreshold
        };
      });
    });
    return initialMap;
  });

  // Lista de solicitudes de reposición
  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('stadium_requests');
    return saved ? JSON.parse(saved) : [];
  });

  // Historial de logs/actividades
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('stadium_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Estados UI & Modales
  const [standTab, setStandTab] = useState('inventory'); // 'inventory' | 'reconciliation'
  const [showAddStandModal, setShowAddStandModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showCustomRestockModal, setShowCustomRestockModal] = useState(null); // item a pedir
  const [customRestockQty, setCustomRestockQty] = useState(24);
  const [newStandName, setNewStandName] = useState('');
  const [newStandLocation, setNewStandLocation] = useState('');
  
  // Nuevo Producto
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Bebidas');
  const [newProdPrice, setNewProdPrice] = useState(1500);
  const [newProdStock, setNewProdStock] = useState(30);

  // Notificaciones Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Guardar en LocalStorage ante cambios
  useEffect(() => {
    localStorage.setItem('stadium_stands', JSON.stringify(stands));
    localStorage.setItem('stadium_catalog', JSON.stringify(productsCatalog));
    localStorage.setItem('stadium_inventory', JSON.stringify(inventory));
    localStorage.setItem('stadium_requests', JSON.stringify(requests));
    localStorage.setItem('stadium_logs', JSON.stringify(logs));
  }, [stands, productsCatalog, inventory, requests, logs]);

  // Asegurar que existan los ítems para un puesto en el mapa de inventario
  const ensureStandInventory = (standId) => {
    setInventory(prev => {
      const next = { ...prev };
      let updated = false;
      productsCatalog.forEach(prod => {
        const key = `${standId}_${prod.id}`;
        if (!next[key]) {
          next[key] = {
            standId,
            productId: prod.id,
            name: prod.name,
            category: prod.category,
            price: prod.price,
            initialStock: prod.initialStock,
            currentStock: prod.initialStock,
            receivedReplenishments: 0,
            minThreshold: prod.minThreshold
          };
          updated = true;
        }
      });
      return updated ? next : prev;
    });
  };

  useEffect(() => {
    if (selectedStandId) {
      ensureStandInventory(selectedStandId);
    }
  }, [selectedStandId, productsCatalog]);

  // --- ACCIONES DE NEGOCIO ---

  // 1. Agregar nuevo Local/Puesto
  const handleCreateStand = (e) => {
    e.preventDefault();
    if (!newStandName.trim()) return;

    const newId = `stand_${Date.now()}`;
    const newStand = {
      id: newId,
      name: newStandName.trim(),
      location: newStandLocation.trim() || 'Estadio'
    };

    setStands(prev => [...prev, newStand]);
    setSelectedStandId(newId);
    ensureStandInventory(newId);

    setNewStandName('');
    setNewStandLocation('');
    setShowAddStandModal(false);
    showToast(`Puesto "${newStand.name}" agregado con éxito`, 'success');
  };

  // 2. Eliminar Local
  const handleDeleteStand = (standId, standName) => {
    if (stands.length <= 1) {
      showToast('Debe haber al menos un local en el estadio', 'warning');
      return;
    }
    if (window.confirm(`¿Seguro que deseas eliminar el puesto "${standName}"?`)) {
      setStands(prev => prev.filter(s => s.id !== standId));
      if (selectedStandId === standId) {
        const nextStand = stands.find(s => s.id !== standId);
        setSelectedStandId(nextStand?.id || '');
      }
      showToast(`Puesto "${standName}" eliminado`, 'info');
    }
  };

  // 3. Crear Producto Global
  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const prodId = `prod_${Date.now()}`;
    const newProduct = {
      id: prodId,
      name: newProdName.trim(),
      category: newProdCategory,
      price: Number(newProdPrice),
      initialStock: Number(newProdStock),
      minThreshold: Math.ceil(Number(newProdStock) * 0.25)
    };

    setProductsCatalog(prev => [...prev, newProduct]);

    // Actualizar inventario de todos los locales con este nuevo producto
    setInventory(prev => {
      const next = { ...prev };
      stands.forEach(stand => {
        next[`${stand.id}_${prodId}`] = {
          standId: stand.id,
          productId: prodId,
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          initialStock: newProduct.initialStock,
          currentStock: newProduct.initialStock,
          receivedReplenishments: 0,
          minThreshold: newProduct.minThreshold
        };
      });
      return next;
    });

    setNewProdName('');
    setShowAddProductModal(false);
    showToast(`Producto "${newProduct.name}" agregado al catálogo`, 'success');
  };

  // 4. Cambiar Stock de un Producto en un Puesto (-1 venta o +1 ajuste)
  const handleStockChange = (standId, productId, delta) => {
    const key = `${standId}_${productId}`;
    setInventory(prev => {
      const item = prev[key];
      if (!item) return prev;
      const newStock = Math.max(0, item.currentStock + delta);
      
      if (newStock === 0 && item.currentStock > 0) {
        showToast(`¡Agotado! ${item.name} en ${getStandsName(standId)}`, 'danger');
      }

      return {
        ...prev,
        [key]: {
          ...item,
          currentStock: newStock
        }
      };
    });
  };

  // 5. Solicitar Reposición (Puesto -> Depósito)
  const handleSendRequest = (standId, product, qty) => {
    const existingPending = requests.find(r => r.standId === standId && r.productId === product.productId && r.status === 'pending');
    if (existingPending) {
      showToast(`Ya hay un pedido pendiente de ${product.name} para este puesto`, 'warning');
      return;
    }

    const newReq = {
      id: `req_${Date.now()}`,
      standId,
      standName: getStandsName(standId),
      productId: product.productId,
      productName: product.name,
      requestedQty: Number(qty),
      status: 'pending', // 'pending' | 'dispatched'
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setRequests(prev => [newReq, ...prev]);
    
    // Registrar log
    addLog(`Solicitud de reposición: ${qty} u. de ${product.name} para ${getStandsName(standId)}`, 'request');

    setShowCustomRestockModal(null);
    showToast(`Pedido de ${qty} u. de ${product.name} enviado al Depósito`, 'success');
  };

  // 6. Entregar / Despachar Reposición (Depósito -> Puesto)
  const handleFulfillRequest = (requestId) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    // Actualizar estado del pedido
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'dispatched', fulfilledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : r));

    // Incrementar stock y reposiciones recibidas en el puesto
    const key = `${req.standId}_${req.productId}`;
    setInventory(prev => {
      const item = prev[key];
      if (!item) return prev;
      return {
        ...prev,
        [key]: {
          ...item,
          currentStock: item.currentStock + req.requestedQty,
          receivedReplenishments: (item.receivedReplenishments || 0) + req.requestedQty
        }
      };
    });

    addLog(`Entregado: ${req.requestedQty} u. de ${req.productName} a ${req.standName}`, 'dispatch');
    showToast(`Reposición entregada con éxito a ${req.standName}`, 'success');
  };

  // Reiniciar valores de un puesto
  const handleResetStand = (standId) => {
    if (!window.confirm(`¿Deseas reiniciar los contadores de stock para ${getStandsName(standId)}?`)) return;
    
    setInventory(prev => {
      const next = { ...prev };
      productsCatalog.forEach(prod => {
        const key = `${standId}_${prod.id}`;
        if (next[key]) {
          next[key] = {
            ...next[key],
            currentStock: next[key].initialStock,
            receivedReplenishments: 0
          };
        }
      });
      return next;
    });

    showToast(`Stock de ${getStandsName(standId)} reiniciado`, 'info');
  };

  // Auxiliares
  const getStandsName = (id) => stands.find(s => s.id === id)?.name || id;

  const addLog = (text, type) => {
    setLogs(prev => [{ id: Date.now(), text, type, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...prev.slice(0, 49)]);
  };

  // Obtener array de inventario para el puesto actual seleccionado
  const currentStandItems = productsCatalog.map(prod => {
    const key = `${selectedStandId}_${prod.id}`;
    return inventory[key] || {
      standId: selectedStandId,
      productId: prod.id,
      name: prod.name,
      category: prod.category,
      price: prod.price,
      initialStock: prod.initialStock,
      currentStock: prod.initialStock,
      receivedReplenishments: 0,
      minThreshold: prod.minThreshold
    };
  });

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR (HEADER) */}
      {/* ========================================================================= */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* LOGO & TITULO */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-inner">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
                EstadioStock <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">EN VIVO</span>
              </h1>
              <p className="text-xs text-slate-400">Control de Stock y Reposición Instantánea</p>
            </div>
          </div>

          {/* SELECTOR DE ROL */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setRole('stand')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === 'stand'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Store className="w-4 h-4" />
              Puesto / Vendedor
            </button>
            <button
              onClick={() => setRole('warehouse')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                role === 'warehouse'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              Depósito / Reposidor
              {pendingRequestsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white font-black rounded-full animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* TOAST NOTIFICACIÓN */}
      {/* ========================================================================= */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 max-w-sm animate-bounce">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold ${
            toast.type === 'danger' ? 'bg-red-950 text-red-200 border-red-700' :
            toast.type === 'warning' ? 'bg-amber-950 text-amber-200 border-amber-700' :
            toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-700' :
            'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* ------------------------------------------------------------------------- */}
        {/* VISTA 1: VENDEDOR / PUESTO */}
        {/* ------------------------------------------------------------------------- */}
        {role === 'stand' && (
          <div className="space-y-6">
            
            {/* SELECCIÓN Y ADMINISTRACIÓN DE LOCALES */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-xl text-slate-300 border border-slate-700">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold">Local en Operación:</label>
                  <select
                    value={selectedStandId}
                    onChange={(e) => setSelectedStandId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-white font-bold text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer mt-0.5"
                  >
                    {stands.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones para agregar / borrar locales */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddStandModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  Nuevo Local
                </button>
                <button
                  onClick={() => handleDeleteStand(selectedStandId, getStandsName(selectedStandId))}
                  className="p-2 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700 transition"
                  title="Eliminar este local"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* BARRA DE NAVEGACIÓN SECUNDARIA DEL PUESTO */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStandTab('inventory')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    standTab === 'inventory'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Control de Stock & Venta
                </button>
                <button
                  onClick={() => setStandTab('reconciliation')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    standTab === 'reconciliation'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  Cierre y Arqueo de Caja
                </button>
              </div>

              <button
                onClick={() => handleResetStand(selectedStandId)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-xs font-medium border border-slate-800 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar Contadores Puesto
              </button>
            </div>

            {/* TABLA 1: INVENTARIO Y CONTROL VIRTUAL */}
            {standTab === 'inventory' && (
              <div className="space-y-6">

                {/* ALERTA DE STOCK AGOTADO */}
                {currentStandItems.some(i => i.currentStock === 0) && (
                  <div className="bg-red-950/40 border border-red-800/80 rounded-2xl p-4 flex items-center gap-3 text-red-200 animate-pulse">
                    <AlertTriangle className="w-6 h-6 shrink-0 text-red-400" />
                    <div>
                      <p className="font-bold text-sm">Hay productos totalmente agotados en este puesto.</p>
                      <p className="text-xs text-red-300/80">Haz clic en el botón de "Pedir Reposición" para solicitar más stock al depósito.</p>
                    </div>
                  </div>
                )}

                {/* TARJETAS DE PRODUCTOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentStandItems.map((item) => {
                    const isOutOfStock = item.currentStock === 0;
                    const isLowStock = item.currentStock <= item.minThreshold && !isOutOfStock;
                    const pendingReq = requests.find(r => r.standId === selectedStandId && r.productId === item.productId && r.status === 'pending');

                    let cardStyle = "bg-slate-900/90 border-slate-800";
                    let badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    let badgeLabel = "STOCK SUFICIENTE";

                    if (isOutOfStock) {
                      cardStyle = "bg-red-950/20 border-red-900/60 shadow-xl shadow-red-950/30";
                      badgeStyle = "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse font-black";
                      badgeLabel = "¡AGOTADO!";
                    } else if (isLowStock) {
                      cardStyle = "bg-amber-950/20 border-amber-900/50";
                      badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                      badgeLabel = "STOCK BAJO";
                    }

                    return (
                      <div 
                        key={item.productId}
                        className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${cardStyle}`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{item.category}</span>
                              <h3 className="font-bold text-base text-white leading-tight">{item.name}</h3>
                              <span className="text-xs text-emerald-400 font-semibold font-mono">${item.price.toLocaleString()} c/u</span>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${badgeStyle}`}>
                              {badgeLabel}
                            </span>
                          </div>

                          {/* CONTRADOR DE STOCK DISPONIBLE */}
                          <div className="my-4 bg-slate-950 rounded-xl p-3.5 border border-slate-800/80 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-medium text-slate-400">Disponible en Local</p>
                              <p className={`text-3xl font-black tracking-tight ${isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-white'}`}>
                                {item.currentStock} <span className="text-xs font-normal text-slate-500">u.</span>
                              </p>
                            </div>
                            <div className="text-right text-[11px] text-slate-400 space-y-0.5">
                              <p>Inicial: <span className="text-slate-200 font-bold">{item.initialStock}</span></p>
                              <p>Repuesto: <span className="text-emerald-400 font-bold">+{item.receivedReplenishments || 0}</span></p>
                            </div>
                          </div>
                        </div>

                        {/* BOTONES DE ACCIÓN */}
                        <div className="space-y-2.5 pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStockChange(selectedStandId, item.productId, -1)}
                              disabled={isOutOfStock}
                              className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 active:scale-95 disabled:opacity-30 disabled:active:scale-100 text-red-300 font-extrabold rounded-xl border border-red-500/30 flex items-center justify-center gap-1.5 transition text-xs"
                            >
                              <Minus className="w-4 h-4" /> Vender 1
                            </button>

                            <button
                              onClick={() => handleStockChange(selectedStandId, item.productId, 1)}
                              className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-xl border border-slate-700 flex items-center justify-center transition"
                              title="Sumar 1 al stock sobrante"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* PEDIDO DE REPOSICIÓN */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSendRequest(selectedStandId, item, 24)}
                              disabled={!!pendingReq}
                              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                pendingReq
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 cursor-not-allowed'
                                  : isOutOfStock || isLowStock
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-950 font-black active:scale-95'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                              }`}
                            >
                              {pendingReq ? (
                                <>
                                  <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                  Pedido enviado (Espere...)
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  {isOutOfStock ? '¡REPOSICIÓN URGENTE (+24)!' : 'Pedir Reposición (+24)'}
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => setShowCustomRestockModal(item)}
                              disabled={!!pendingReq}
                              className="px-2.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs font-bold"
                              title="Especificar cantidad de reposición personalizada"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TABLA 2: CIERRE Y ARQUEO DE CAJA DEL PUESTO */}
            {standTab === 'reconciliation' && (
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 md:p-6 space-y-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-emerald-400" />
                      Planilla de Arqueo y Cierre de Caja — {getStandsName(selectedStandId)}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fórmula: (Stock Inicial + Reposiciones) - Sobrante Actual = Cantidad Vendida
                    </p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
                  >
                    <Printer className="w-4 h-4" /> Imprimir Resumen
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4 font-bold">Producto</th>
                        <th className="py-3 px-4 text-center font-bold">Precio Unit.</th>
                        <th className="py-3 px-4 text-center font-bold">Stock Inicial</th>
                        <th className="py-3 px-4 text-center font-bold text-emerald-400">+ Reposiciones</th>
                        <th className="py-3 px-4 text-center font-bold text-amber-400">- Sobrante Final</th>
                        <th className="py-3 px-4 text-center font-black text-white bg-slate-800/60">= Cant. Vendida</th>
                        <th className="py-3 px-4 text-right font-black text-emerald-400">Total a Rendir ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-medium">
                      {currentStandItems.map((item) => {
                        const initial = item.initialStock || 0;
                        const received = item.receivedReplenishments || 0;
                        const remaining = item.currentStock || 0;
                        const sold = Math.max(0, (initial + received) - remaining);
                        const totalRevenue = sold * item.price;

                        return (
                          <tr key={item.productId} className="hover:bg-slate-800/40">
                            <td className="py-3.5 px-4 font-bold text-white">{item.name}</td>
                            <td className="py-3.5 px-4 text-center font-mono">${item.price.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-center">{initial}</td>
                            <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">+{received}</td>
                            <td className="py-3.5 px-4 text-center text-amber-400 font-bold">{remaining}</td>
                            <td className="py-3.5 px-4 text-center font-black text-white bg-slate-950/80 text-base font-mono">
                              {sold}
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 font-mono text-base">
                              ${totalRevenue.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-950 border-t-2 border-slate-800">
                      <tr>
                        <td colSpan="5" className="py-4 px-4 text-right text-xs uppercase tracking-wider text-slate-400 font-bold">
                          Totales Rendición de Caja:
                        </td>
                        <td className="py-4 px-4 text-center font-black text-white text-lg font-mono">
                          {currentStandItems.reduce((acc, i) => acc + Math.max(0, (i.initialStock + (i.receivedReplenishments || 0)) - i.currentStock), 0)} u.
                        </td>
                        <td className="py-4 px-4 text-right font-black text-emerald-400 text-xl font-mono">
                          ${currentStandItems.reduce((acc, i) => {
                            const sold = Math.max(0, (i.initialStock + (i.receivedReplenishments || 0)) - i.currentStock);
                            return acc + (sold * i.price);
                          }, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* VISTA 2: DEPÓSITO CENTRAL / REPOSIDOR */}
        {/* ------------------------------------------------------------------------- */}
        {role === 'warehouse' && (
          <div className="space-y-6">

            {/* BARRA DE MÉTRICAS GENERALES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Solicitudes Pendientes</p>
                  <p className="text-3xl font-black text-amber-400 mt-1">{pendingRequestsCount}</p>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Puestos Activos</p>
                  <p className="text-3xl font-black text-white mt-1">{stands.length}</p>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reposiciones Completadas</p>
                  <p className="text-3xl font-black text-emerald-400 mt-1">
                    {requests.filter(r => r.status === 'dispatched').length}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* COLA DE SOLICITUDES DE REPOSICIÓN URGENTES */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 md:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-400" />
                  Solicitudes de Reposición por Despachar
                </h2>
                <span className="text-xs font-semibold text-slate-400">Actualizado en vivo</span>
              </div>

              {requests.filter(r => r.status === 'pending').length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/40" />
                  <p className="text-sm font-bold text-slate-400">No hay pedidos pendientes de reposición.</p>
                  <p className="text-xs">Todos los locales del estadio cuentan con suficiente stock en este momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {requests.filter(r => r.status === 'pending').map((req) => {
                    const itemKey = `${req.standId}_${req.productId}`;
                    const currentStock = inventory[itemKey]?.currentStock ?? 'N/A';
                    const isCritical = currentStock === 0;

                    return (
                      <div
                        key={req.id}
                        className={`rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                          isCritical
                            ? 'bg-red-950/40 border-red-800/80 shadow-lg shadow-red-950/40'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-black text-amber-400 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                                {req.standName}
                              </span>
                              <h3 className="font-bold text-base text-white mt-2 leading-tight">{req.productName}</h3>
                              <span className="text-[10px] text-slate-500">Hora del pedido: {req.timestamp}</span>
                            </div>
                            {isCritical && (
                              <span className="text-[9px] font-black px-2 py-0.5 bg-red-500 text-white rounded-full animate-bounce">
                                URGENTE
                              </span>
                            )}
                          </div>

                          <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <p className="text-slate-400 text-[11px]">Queda en puesto:</p>
                              <p className={`font-black text-sm ${isCritical ? 'text-red-400' : 'text-slate-200'}`}>
                                {currentStock} u.
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-400 text-[11px]">Solicita llevar:</p>
                              <p className="font-black text-emerald-400 text-sm">
                                +{req.requestedQty} u.
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleFulfillRequest(req.id)}
                          className="mt-4 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition"
                        >
                          <Check className="w-4 h-4" />
                          Despachar y Entregar en Puesto
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MONITOR GENERAL DE TODOS LOS LOCALES DEL ESTADIO */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 md:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-400" />
                  Estado del Inventario en Todos los Locales
                </h2>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" /> Nuevo Producto Global
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stands.map((stand) => {
                  const standItems = productsCatalog.map(p => inventory[`${stand.id}_${p.id}`]).filter(Boolean);
                  const outOfStockCount = standItems.filter(i => i.currentStock === 0).length;

                  return (
                    <div key={stand.id} className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                          <h3 className="font-extrabold text-sm text-white">{stand.name}</h3>
                          <span className="text-[10px] text-slate-500">{stand.location}</span>
                        </div>
                        {outOfStockCount > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
                            {outOfStockCount} agotados
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                            OK
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {standItems.map((item) => (
                          <div key={item.productId} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 last:border-none">
                            <span className="text-slate-300 font-medium">{item.name}</span>
                            <span className={`font-bold font-mono ${
                              item.currentStock === 0 ? 'text-red-400 font-black' :
                              item.currentStock <= item.minThreshold ? 'text-amber-400' :
                              'text-slate-400'
                            }`}>
                              {item.currentStock} u.
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HISTORIAL Y AUDITORÍA DE LOGS */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 md:p-6 space-y-3 shadow-xl">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Registro Auditor de Actividad y Despachos
              </h2>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Sin actividad registrada en esta sesión.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl text-xs border border-slate-800/80">
                      <span className="text-slate-300 font-medium">{log.text}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{log.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODALES */}
      {/* ========================================================================= */}

      {/* MODAL 1: AGREGAR NUEVO LOCAL / PUESTO */}
      {showAddStandModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Crear Nuevo Puesto / Local
              </h3>
              <button onClick={() => setShowAddStandModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStand} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nombre del Local</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Puesto Platea Preferencial #4"
                  value={newStandName}
                  onChange={(e) => setNewStandName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Ubicación / Sector</label>
                <input
                  type="text"
                  placeholder="Ej: Sector Puerta 3"
                  value={newStandLocation}
                  onChange={(e) => setNewStandLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStandModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Guardar Local
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CANTIDAD PERSONALIZADA DE REPOSICIÓN */}
      {showCustomRestockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                Reposición Personalizada
              </h3>
              <button onClick={() => setShowCustomRestockModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Producto: <strong className="text-white">{showCustomRestockModal.name}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Cantidad a Solicitar (Unidades)</label>
              <input
                type="number"
                min="1"
                value={customRestockQty}
                onChange={(e) => setCustomRestockQty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-base font-bold font-mono text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomRestockModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSendRequest(selectedStandId, showCustomRestockModal, customRestockQty)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
              >
                Enviar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AGREGAR NUEVO PRODUCTO AL CATÁLOGO */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                Agregar Producto al Catálogo
              </h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Hamburguesa Especial"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Categoría</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="Bebidas">Bebidas</option>
                    <option value="Comida">Comida</option>
                    <option value="Golosinas">Golosinas</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Precio Unitario ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Stock Inicial Sugerido</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
