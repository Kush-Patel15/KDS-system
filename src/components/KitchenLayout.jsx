import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";
import { fetchActiveOrders, updateOrderStatus } from "../api/client";
import { useStomp } from "../ws/useStomp";

const FLOW = ["received","preparing","plating","ready"];
const STATIONS = ["Grill","Fryer","Assembly"];

function deriveStation(category) {
  if (!category) return "Assembly";
  const c = category.toUpperCase();
  if (["PIZZA","BURGER","BURGERS","GRILL"].includes(c)) return "Grill";
  if (["SIDES","FRIES","FRYER"].includes(c)) return "Fryer";
  return "Assembly";
}

const KitchenLayout = ({ theme, toggleTheme, user }) => {
  const [orders,setOrders] = useState([]);
  const [filterStation,setFilterStation] = useState("ALL");
  const [search,setSearch] = useState("");
  const [now,setNow] = useState(new Date());
  const [soundOn,setSoundOn] = useState(true);
  const newHighlightRef = useRef(new Set()); // order ids to animate
  const audioRef = useRef(null);

  /* Clock */
  useEffect(()=> {
    const t = setInterval(()=> setNow(new Date()),1000);
    return ()=> clearInterval(t);
  },[]);

  /* Initial load */
  useEffect(()=> {
    let stopped = false;
    const load = async () =>{
      try {
        const data = await fetchActiveOrders();
        if (stopped) return;
        setOrders(normalizeMany(data));
      } catch(e){
        console.error("Active load failed:", e.message);
      }
    };
    load();
    return ()=> { stopped = true; };
  },[]);

  /* WebSocket subscription */
  useStomp([{
    destination: "/topic/orders",
    callback: msg => {
      if (msg.type === "created") {
        const norm = normalizeOne(msg.order);
        newHighlightRef.current.add(norm.id);
        setOrders(o => [...o, norm]);
        if (soundOn && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(()=>{});
        }
        setTimeout(()=> {
          newHighlightRef.current.delete(norm.id);
        }, 6000);
      } else if (msg.type === "status") {
        setOrders(o => o.map(or =>
          or.id === msg.order.id
            ? { ...or, status: (msg.order.status || or.status).toLowerCase(), completedAt: msg.order.completedAt || or.completedAt }
            : or
        ));
      }
    }
  }]);

  /* Normalizers */
  function normalizeMany(list){
    return (list||[]).map(normalizeOne);
  }
  function normalizeOne(o){
    return {
      id: o.id,
      code: o.code || o.orderId || `ORD-${o.id}`,
      status: (o.status || "received").toLowerCase(),
      receivedAt: o.createdAt,
      completedAt: o.completedAt,
      specialInstruction: o.specialInstruction || "",
      items: (o.items||[]).map(it => ({
        id: it.id,
        name: it.menuItem?.name || it.menuItemName || it.name,
        quantity: it.quantity || 1,
        station: it.menuItem?.stationType || it.stationType || deriveStation(it.menuItem?.category || it.category)
      }))
    };
  }

  /* Advance status */
  const advance = async (order) => {
    const idx = FLOW.indexOf(order.status);
    if (idx === -1 || idx === FLOW.length -1) return;
    const next = FLOW[idx+1];
    try {
      const updated = await updateOrderStatus(order.id, next.toUpperCase());
      setOrders(os => os.map(o => o.id === order.id
        ? { ...o, status: (updated.status || next).toLowerCase(), completedAt: updated.completedAt || o.completedAt }
        : o));
    } catch(e){
      console.error("Advance failed:", e.message);
    }
  };

  /* Analytics */
  const activeCount = useMemo(()=> orders.filter(o => o.status !== "ready").length, [orders]);
  const completedCount = useMemo(()=> orders.filter(o => o.status === "ready").length, [orders]);
  const avgTimeMins = useMemo(()=> {
    const comps = orders.filter(o => o.status==="ready" && o.receivedAt && o.completedAt);
    if (!comps.length) return 0;
    const totalSec = comps.reduce((acc,o)=>{
      const start = Date.parse(o.receivedAt);
      const end = Date.parse(o.completedAt);
      if (!isNaN(start) && !isNaN(end) && end>start) return acc + (end-start)/1000;
      return acc;
    },0);
    return Math.round(totalSec / comps.length / 60);
  },[orders]);
  const totalCount = orders.length;

  const loadLevel = activeCount >= 15 ? "critical" : activeCount >= 10 ? "heavy" : activeCount >=5 ? "moderate" : "light";

  /* Search & station filter */
  const filtered = useMemo(()=> {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      if (filterStation !== "ALL" && !o.items.some(it => it.station === filterStation)) return false;
      if (!q) return true;
      if (o.code.toLowerCase().includes(q)) return true;
      return o.items.some(it => it.name.toLowerCase().includes(q));
    });
  },[orders, filterStation, search]);

  const lanes = useMemo(()=> ({
    received: filtered.filter(o=>o.status==="received"),
    preparing: filtered.filter(o=>o.status==="preparing"),
    plating: filtered.filter(o=>o.status==="plating"),
    ready: filtered.filter(o=>o.status==="ready"),
  }),[filtered]);

  /* Helpers */
  const formatClock = (d)=> d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  const top3 = useMemo(()=> topItems(orders),[orders]);

  return (
    <div className="min-h-screen bg-[#0b1119] text-gray-200 flex flex-col">
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 backdrop-blur bg-[#0b1119]/90 border-b border-gray-800/60">
        <div className="px-5 py-4 flex flex-wrap gap-4 items-center">
            <h1 className="text-2xl font-semibold tracking-wide">Kitchen Display</h1>
          <span className={`text-xs px-2 py-1 rounded-full font-medium
            ${loadLevel==="critical" ? "bg-red-600/20 text-red-400 ring-1 ring-red-600/30" :
               loadLevel==="heavy" ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30" :
               loadLevel==="moderate" ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30" :
               "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"}`}>
            {loadLevel === "critical" ? "Critical Load" :
             loadLevel === "heavy" ? "Heavy Load" :
             loadLevel === "moderate" ? "Moderate Load" : "Light Load"}
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:flex text-sm text-gray-400">{formatClock(now)}</div>
            <div className="flex gap-1">
              <ToggleChip
                active={soundOn}
                onClick={()=>setSoundOn(s=>!s)}
                title="Toggle new order sound"
              >🔔</ToggleChip>
              <ToggleChip
                active={theme==="dark"}
                onClick={toggleTheme}
                title="Toggle theme"
              >{theme==="dark"?"🌙":"☀️"}</ToggleChip>
            </div>
            <div className="px-3 py-1 text-xs rounded bg-gray-800/70">
              {user?.name} <span className="text-gray-500">({user?.role})</span>
            </div>
          </div>

          {/* Station Filters */}
          <div className="w-full flex flex-wrap gap-2">
            <FilterButton active={filterStation==="ALL"} onClick={()=>setFilterStation("ALL")}>All</FilterButton>
            {STATIONS.map(st => (
              <FilterButton key={st} active={filterStation===st} onClick={()=>setFilterStation(st)}>{st}</FilterButton>
            ))}
            <div className="flex-1 min-w-[180px] relative">
              <input
                aria-label="Search orders"
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search order or item..."
                className="w-full bg-gray-800/60 border border-gray-700/60 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none rounded-md px-3 py-1.5 text-sm placeholder-gray-500 transition"
              />
              {search && (
                <button
                  onClick={()=>setSearch("")}
                  className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-200 text-xs"
                  aria-label="Clear search"
                >✕</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="px-5 mt-5">
        <div className="grid gap-4 md:grid-cols-5">
          <AnalyticCard label="Active" value={activeCount} color="cyan" />
          <AnalyticCard label="Completed" value={completedCount} color="emerald" />
          <AnalyticCard label="Avg Time" value={`${avgTimeMins}m`} color="indigo"
            sub={`Across ${completedCount} ready`} />
          <AnalyticCard label="Total" value={totalCount} color="blue" />
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700/50 rounded-lg p-3 flex flex-col">
            <div className="text-xs font-semibold tracking-wide text-gray-400 mb-1">Top Items</div>
            <div className="flex-1 space-y-1.5">
              {top3.length === 0 && <div className="text-[11px] text-gray-500">No data</div>}
              {top3.map(it=>(
                <div key={it.name} className="flex items-center justify-between text-[11px]">
                  <span className="truncate max-w-[110px]">{it.name}</span>
                  <span className="text-cyan-400 font-medium">{it.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lanes */}
      <div className="px-5 pt-6 pb-10 grid gap-5 md:grid-cols-4 flex-1">
        <Lane title="Received" accent="cyan" orders={lanes.received} onAdvance={advance} newHighlightRef={newHighlightRef}/>
        <Lane title="Preparing" accent="amber" orders={lanes.preparing} onAdvance={advance} newHighlightRef={newHighlightRef}/>
        <Lane title="Plating" accent="violet" orders={lanes.plating} onAdvance={advance} newHighlightRef={newHighlightRef}/>
        <Lane title="Ready" accent="emerald" orders={lanes.ready} onAdvance={advance} isFinal newHighlightRef={newHighlightRef}/>
      </div>
    </div>
  );
};

/* --- Subcomponents --- */

const ToggleChip = ({active,children,onClick,title}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`w-9 h-9 rounded-md text-lg flex items-center justify-center transition
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50
      ${active ? "bg-cyan-600/30 text-cyan-300 ring-1 ring-cyan-500/40 hover:bg-cyan-600/40"
               : "bg-gray-800/60 text-gray-400 hover:text-gray-200 hover:bg-gray-700/60"}`}
  >
    {children}
  </button>
);

const FilterButton = ({active,children,onClick}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50
      ${active
        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow ring-1 ring-cyan-400/30"
        : "bg-gray-800/60 hover:bg-gray-700/70 text-gray-300"}`}
  >
    {children}
  </button>
);

const AnalyticCard = ({label,value,color,sub}) => {
  const barColor = {
    cyan: "bg-cyan-500",
    emerald: "bg-emerald-500",
    indigo: "bg-indigo-500",
    blue: "bg-blue-500"
  }[color] || "bg-cyan-500";
  return (
    <div className="relative group bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700/50 rounded-lg p-3 flex flex-col overflow-hidden">
      <div className="text-[11px] font-medium tracking-wide uppercase text-gray-500">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold">{value}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-auto">{sub}</div>}
      <div className="mt-2 h-1.5 w-full bg-gray-700/50 rounded">
        <div className={`h-full ${barColor} rounded`} style={{width:"100%"}} />
      </div>
    </div>
  );
};

const Lane = ({ title, orders, onAdvance, accent, isFinal, newHighlightRef }) => {
  const accentBar = {
    cyan: "from-cyan-500/60 to-blue-500/60",
    amber: "from-amber-500/60 to-orange-500/60",
    violet: "from-violet-500/60 to-fuchsia-500/60",
    emerald: "from-emerald-500/60 to-teal-500/60"
  }[accent] || "from-cyan-500/60 to-blue-500/60";

  return (
    <div className="flex flex-col bg-[#101720] border border-gray-800/60 rounded-xl overflow-hidden shadow-sm">
      <div className={`h-1 w-full bg-gradient-to-r ${accentBar}`} />
      <div className="px-4 py-2 flex items-center justify-between">
        <h2 className="font-semibold text-sm tracking-wide text-gray-200">{title} ({orders.length})</h2>
      </div>
      <div className="px-3 pb-4 pt-1 flex-1 overflow-y-auto space-y-3 custom-scroll">
        {orders.length === 0 && (
          <EmptyState />
        )}
        {orders.map(o => {
          const isNew = newHighlightRef.current.has(o.id);
          const critical = /allergy|allerg/i.test(o.specialInstruction) || /rush|urgent/i.test(o.specialInstruction);
          return (
            <div
              key={o.id}
              className={`relative bg-[#182231] rounded-lg border border-gray-700/50 p-3 text-xs space-y-2 shadow transition
                ${isNew ? "ring-2 ring-cyan-400/60 animate-pulse" : "hover:border-cyan-600/40"}
              `}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-100">{o.code}</span>
                <span className="text-[10px] text-gray-500">{timeSince(o.receivedAt)}m</span>
              </div>
              <div className="space-y-1">
                {o.items.map(it => (
                  <div key={it.id} className="flex justify-between gap-2">
                    <span className="text-gray-300 truncate">{it.name} x {it.quantity}</span>
                    <span className="text-[9px] px-2 py-[2px] rounded-full bg-gray-700/70 text-gray-300">{it.station}</span>
                  </div>
                ))}
              </div>
              {o.specialInstruction && (
                <div className={`text-[10px] leading-snug rounded px-2 py-1
                  ${critical ? "bg-red-500/10 text-red-300 border border-red-500/30"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/30"}`}>
                  {o.specialInstruction}
                </div>
              )}
              {!isFinal && (
                <button
                  onClick={()=>onAdvance(o)}
                  className="w-full mt-1.5 text-xs font-medium py-1.5 rounded-md
                    bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
                    text-white tracking-wide shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                >
                  Next
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-500 text-[11px] gap-2">
    <div className="text-xl">🧺</div>
    <div>No orders</div>
  </div>
);

/* --- Helpers --- */

function timeSince(ts){
  if(!ts) return 0;
  const start = Date.parse(ts);
  if(isNaN(start)) return 0;
  return Math.max(0, Math.floor((Date.now()-start)/60000));
}

function topItems(orders, limit=3){
  const counts = {};
  orders.forEach(o => o.items.forEach(it => {
    counts[it.name] = (counts[it.name]||0) + it.quantity;
  }));
  return Object.entries(counts)
    .map(([name,count])=>({name,count}))
    .sort((a,b)=>b.count - a.count)
    .slice(0,limit);
}

export default KitchenLayout;