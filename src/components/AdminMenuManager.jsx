import React, {
  useEffect,
  useState,
  useMemo,
  useRef
} from "react";
import { useStomp } from "../ws/useStomp";

const base = import.meta.env.VITE_API_BASE_URL;

const CATEGORY_COLORS = {
  MAIN: "bg-indigo-500/20 text-indigo-300 ring-indigo-500/40",
  STARTER: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40",
  DRINK: "bg-cyan-500/20 text-cyan-300 ring-cyan-500/40",
  DESSERT: "bg-pink-500/20 text-pink-300 ring-pink-500/40",
  SIDES: "bg-amber-500/20 text-amber-300 ring-amber-500/40"
};

const defaultForm = {
  name: "",
  price: "",
  category: "",
  description: "",
  isAvailable: true,
  isPopular: false
};

export default function AdminMenuManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [dir, setDir] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");
  const drawerRef = useRef(null);

  /* Load items */
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(base + "/menu-items");
      if (!r.ok) throw new Error("Failed to load");
      const data = await r.json();
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* WebSocket live updates */
  useStomp([{
    destination: "/topic/menu",
    callback: msg => {
      if (msg.type === "created") {
        setItems(list => [...list, msg.item]);
      } else if (msg.type === "updated") {
        setItems(list => list.map(i => i.id === msg.item.id ? msg.item : i));
      } else if (msg.type === "deleted") {
        setItems(list => list.filter(i => i.id !== msg.id));
      }
    }
  }]);

  /* Derived categories */
  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  /* Filter + search + sort */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter(i => {
      if (filterCat !== "ALL" && i.category !== filterCat) return false;
      if (!q) return true;
      return (
        i.name?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q)
      );
    });
    list = list.sort((a, b) => {
      const va = a[sort];
      const vb = b[sort];
      if (va == null && vb == null) return 0;
      if (va == null) return dir === "asc" ? -1 : 1;
      if (vb == null) return dir === "asc" ? 1 : -1;
      if (typeof va === "number" && typeof vb === "number") {
        return dir === "asc" ? va - vb : vb - va;
      }
      return dir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return list;
  }, [items, search, sort, dir, filterCat]);

  /* Handlers */
  const startEdit = (it) => {
    setEditing(it.id);
    setForm({
      name: it.name || "",
      price: it.price ?? "",
      category: it.category || "",
      description: it.description || "",
      isAvailable: it.isAvailable !== false,
      isPopular: it.isPopular === true
    });
    setTimeout(() => drawerRef.current?.focus(), 20);
  };

  const reset = () => {
    setEditing(null);
    setForm(defaultForm);
  };

  const change = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]:
        type === "checkbox" ? checked : (name === "price" ? value.replace(/^0+/, "0") : value)
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (String(form.price).trim() === "" || Number(form.price) < 0) return;
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      isAvailable: form.isAvailable,
      isPopular: form.isPopular
    };
    const method = editing ? "PUT" : "POST";
    const url = base + "/menu-items" + (editing ? "/" + editing : "");
    // Optimistic
    let rollback;
    if (!editing) {
      const tempId = "tmp-" + Date.now();
      const optimistic = { id: tempId, ...payload };
      setItems(list => [...list, optimistic]);
      rollback = () => setItems(list => list.filter(i => i.id !== tempId));
    } else {
      const before = items.find(i => i.id === editing);
      rollback = () => setItems(list => list.map(i => i.id === editing ? before : i));
      setItems(list => list.map(i => i.id === editing ? { ...i, ...payload } : i));
    }
    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error("Save failed");
      const saved = await r.json();
      setItems(list =>
        list
          .filter(i => !String(i.id).startsWith("tmp-"))
          .map(i => (i.id === saved.id ? saved : i))
          .concat(list.some(i => i.id === saved.id) ? [] : [saved])
      );
      reset();
    } catch (e) {
      rollback && rollback();
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (it, field) => {
    const updated = { ...it, [field]: !it[field] };
    setItems(list => list.map(i => i.id === it.id ? updated : i));
    try {
      await fetch(base + "/menu-items/" + it.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
    } catch {
      // revert
      setItems(list => list.map(i => i.id === it.id ? it : i));
    }
  };

  const destroyItem = async (id) => {
    if (!confirm("Delete this item?")) return;
    const before = items;
    setItems(list => list.filter(i => i.id !== id));
    try {
      const r = await fetch(base + "/menu-items/" + id, { method: "DELETE" });
      if (!r.ok) throw new Error();
    } catch {
      setItems(before);
      alert("Delete failed");
    }
  };

  const headerSort = key => {
    if (sort === key) setDir(d => d === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setDir("asc");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1119] text-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-800/70 backdrop-blur bg-[#0b1119]/90">
        <h1 className="text-2xl font-semibold tracking-wide">Menu Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add, edit and organize customer‑facing menu items in real time.
        </p>
      </div>

      <div className="p-6 flex flex-col gap-6 flex-1">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            <FilterChip active={filterCat === "ALL"} onClick={() => setFilterCat("ALL")}>All</FilterChip>
            {categories.map(c => (
              <FilterChip key={c} active={filterCat === c} onClick={() => setFilterCat(c)}>
                {c}
              </FilterChip>
            ))}
          </div>
          <div className="flex-1 min-w-[220px] relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, category, description..."
              className="w-full bg-gray-800/60 border border-gray-700/60 rounded-md px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-200 text-xs"
                aria-label="Clear search"
              >✕</button>
            )}
          </div>
          <button
            onClick={reset}
            className="px-4 py-2 text-sm rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 transition font-medium shadow"
          >
            {editing ? "Add New" : "New Item"}
          </button>
        </div>

        {/* Editor Drawer */}
        <form
          onSubmit={submit}
            ref={drawerRef}
          tabIndex={-1}
          className="bg-[#121b25] border border-gray-800/70 rounded-xl p-5 grid gap-4 md:grid-cols-5 focus:outline-none"
        >
          <div className="md:col-span-2 space-y-3">
            <Input
              label="Name"
              name="name"
              value={form.name}
              onChange={change}
              required
              placeholder="Item name"
            />
            <Input
              label="Price"
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={change}
              required
              placeholder="e.g. 120"
            />
            <Input
              label="Category"
              name="category"
              value={form.category}
              onChange={change}
              placeholder="MAIN / DRINK / DESSERT ..."
            />
          </div>

          <div className="md:col-span-2 space-y-3">
            <TextArea
              label="Description"
              name="description"
              value={form.description}
              onChange={change}
              placeholder="Short description (optional)"
              rows={4}
            />
            <div className="flex gap-6 pt-1">
              <Toggle
                label="Available"
                checked={form.isAvailable}
                name="isAvailable"
                onChange={change}
              />
              <Toggle
                label="Popular"
                checked={form.isPopular}
                name="isPopular"
                onChange={change}
              />
            </div>
          </div>

          <div className="md:col-span-1 flex flex-col justify-between gap-3">
            <div className="space-y-2 text-xs text-gray-500">
              <p>{editing ? "Editing existing item." : "Creating a new item."}</p>
              <p>Changes broadcast instantly.</p>
            </div>
            <div className="flex gap-2 mt-auto">
              {editing && (
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 px-3 py-2 rounded-md text-sm bg-gray-700/60 hover:bg-gray-600/60 transition"
                >
                  Cancel
                </button>
              )}
              <button
                disabled={saving}
                className="flex-1 px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 disabled:opacity-50 transition shadow"
              >
                {saving ? "Saving..." : editing ? "Update" : "Add"}
              </button>
            </div>
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
          </div>
        </form>

        {/* List Panel */}
        <div className="bg-[#121b25] border border-gray-800/70 rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800/70">
            <h2 className="font-semibold text-sm tracking-wide">Items ({visible.length})</h2>
            <div className="flex gap-2 text-xs">
              <SortButton label="Name" active={sort==="name"} dir={dir} onClick={()=>headerSort("name")}/>
              <SortButton label="Price" active={sort==="price"} dir={dir} onClick={()=>headerSort("price")}/>
              <SortButton label="Category" active={sort==="category"} dir={dir} onClick={()=>headerSort("category")}/>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500 bg-gray-900/40">
                <tr>
                  <Th>Name</Th>
                  <Th>Price</Th>
                  <Th>Category</Th>
                  <Th className="hidden md:table-cell">Description</Th>
                  <Th>Flags</Th>
                  <Th className="text-right pr-6">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading && Array.from({length:5}).map((_,i)=>(
                  <tr key={i} className="animate-pulse">
                    <Td colSpan={6}>
                      <div className="h-5 bg-gray-700/40 rounded" />
                    </Td>
                  </tr>
                ))}
                {!loading && visible.length === 0 && (
                  <tr>
                    <Td colSpan={6}>
                      <div className="py-10 text-center text-xs text-gray-500">
                        {search || filterCat !== "ALL"
                          ? "No items match filters."
                          : "No menu items yet. Add your first above."}
                      </div>
                    </Td>
                  </tr>
                )}
                {visible.map(it => (
                  <tr key={it.id} className="hover:bg-gray-900/40 transition">
                    <Td className="font-medium text-gray-100">
                      {it.name}
                    </Td>
                    <Td>
                      <span className="text-gray-300">₹{it.price}</span>
                    </Td>
                    <Td>
                      {it.category
                        ? <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ring-1 ${CATEGORY_COLORS[it.category] || "bg-gray-600/30 text-gray-300 ring-gray-500/40"}`}>{it.category}</span>
                        : <span className="text-[10px] text-gray-500">—</span>}
                    </Td>
                    <Td className="hidden md:table-cell">
                      <span className="block max-w-[280px] truncate text-gray-400">
                        {it.description || <span className="text-gray-600">No description</span>}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Flag
                          active={it.isAvailable !== false}
                          label="Avail"
                          onClick={()=>toggle(it,"isAvailable")}
                          color="cyan"
                        />
                        <Flag
                          active={it.isPopular === true}
                          label="Pop"
                          onClick={()=>toggle(it,"isPopular")}
                          color="amber"
                        />
                      </div>
                    </Td>
                    <Td className="text-right pr-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={()=>startEdit(it)}
                          className="px-2 py-1 text-xs rounded bg-blue-600/70 hover:bg-blue-600 text-white font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={()=>destroyItem(it.id)}
                          className="px-2 py-1 text-xs rounded bg-red-600/70 hover:bg-red-600 text-white font-medium"
                        >
                          Del
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

/* UI Primitives */

const Input = ({label,...rest}) => (
  <label className="block">
    <span className="text-xs font-medium text-gray-400 mb-1 block">{label}</span>
    <input
      {...rest}
      className={`w-full bg-gray-800/60 border border-gray-700/60 rounded-md px-3 py-2 text-sm
        placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500
        transition ${rest.className||""}`}
    />
  </label>
);

const TextArea = ({label,...rest}) => (
  <label className="block">
    <span className="text-xs font-medium text-gray-400 mb-1 block">{label}</span>
    <textarea
      {...rest}
      className="w-full bg-gray-800/60 border border-gray-700/60 rounded-md px-3 py-2 text-sm
        placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500
        transition resize-none"
    />
  </label>
);

const Toggle = ({label,checked,...rest}) => (
  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      {...rest}
      className="peer h-4 w-4 rounded border-gray-600 bg-gray-700/50
        text-cyan-500 focus:ring-cyan-500/40 focus:ring-2 focus:outline-none"
    />
    <span className="text-gray-300 peer-focus:text-cyan-300">{label}</span>
  </label>
);

const FilterChip = ({active,children,onClick}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md text-xs font-medium transition focus:outline-none
      focus:ring-2 focus:ring-cyan-500/40
      ${active
        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow"
        : "bg-gray-800/60 hover:bg-gray-700/70 text-gray-300"}`}
  >
    {children}
  </button>
);

const SortButton = ({label,active,dir,onClick}) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 rounded text-[11px] font-medium tracking-wide transition
      focus:outline-none focus:ring-2 focus:ring-cyan-500/40
      ${active
        ? "bg-cyan-600/30 text-cyan-200 ring-1 ring-cyan-500/40"
        : "bg-gray-800/40 text-gray-400 hover:text-gray-200"}`}
  >
    {label}{active && (dir==="asc" ? " ↑" : " ↓")}
  </button>
);

const Flag = ({active,label,onClick,color}) => {
  const palette = {
    cyan: active
      ? "bg-cyan-600/30 text-cyan-300 ring-1 ring-cyan-500/40"
      : "bg-gray-700/50 text-gray-400 hover:bg-gray-600/50",
    amber: active
      ? "bg-amber-500/30 text-amber-300 ring-1 ring-amber-500/40"
      : "bg-gray-700/50 text-gray-400 hover:bg-gray-600/50"
  }[color] || "bg-gray-700/50 text-gray-400";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[10px] font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${palette}`}
    >
      {label}
    </button>
  );
};

const Th = ({children,className=""}) => (
  <th className={`py-2 px-4 font-medium ${className}`}>{children}</th>
);

const Td = ({children,className="",...rest}) => (
  <td className={`py-3 px-4 align-top ${className}`} {...rest}>{children}</td>
);

/* Helpers */
function topItems(list, limit=3){
  const counts = {};
  list.forEach(i => {
    counts[i.name] = (counts[i.name]||0) + 1;
  });
  return Object.entries(counts).map(([name,count])=>({name,count}))
    .sort((a,b)=>b.count - a.count).slice(0,limit);
}