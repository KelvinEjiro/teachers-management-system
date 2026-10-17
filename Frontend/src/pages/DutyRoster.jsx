import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { addDays, eachDate, isWeekend, mondayOf, prettyDate, todayStr } from '../lib/dates';
import { canWork, SHIFTS } from '../lib/constants';

export default function DutyRoster() {
  const { isAdmin } = useAuth();
  const monday = mondayOf(todayStr());
  const [range, setRange] = useState({ from: monday, to: addDays(monday, 13) });
  const [slots, setSlots] = useState({ morning: 2, evening: 2 });
  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [swap, setSwap] = useState(null); // assignment being reassigned

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [duty, st] = await Promise.all([
        api.get('/duty', { params: range }),
        api.get('/staff', { params: { active: true } }),
      ]);
      setItems(duty.data);
      setStaff(st.data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (range.from && range.to && range.from <= range.to) load();
  }, [load, range]);

  const byCell = useMemo(() => {
    const map = {};
    items.forEach((i) => ((map[`${i.date}:${i.shift}`] ||= []).push(i)));
    return map;
  }, [items]);

  const days = range.from && range.to && range.from <= range.to && range.to <= addDays(range.from, 92) ? eachDate(range.from, range.to) : [];

  const generate = async () => {
    if (items.length && !window.confirm('This replaces any existing duty in the selected dates. Continue?')) return;
    setGenerating(true);
    try {
      const { data } = await api.post('/duty/generate', {
        startDate: range.from,
        endDate: range.to,
        morningSlots: slots.morning,
        eveningSlots: slots.evening,
      });
      setWarnings(data.warnings);
      toast.success(`Roster generated: ${data.created} duty slots`);
      if (data.warnings.length) toast(`${data.warnings.length} slot(s) could not be filled`, { icon: '⚠️' });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const clear = async () => {
    if (!window.confirm('Clear all duty in these dates?')) return;
    try {
      const { data } = await api.delete('/duty', { params: range });
      toast.success(`Cleared ${data.deleted} slots`);
      setWarnings([]);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const reassign = async (staffId) => {
    try {
      await api.patch(`/duty/${swap._id}`, { staffId });
      toast.success('Duty reassigned');
      setSwap(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const removeSlot = async () => {
    try {
      await api.delete(`/duty/${swap._id}`);
      toast.success('Duty slot removed');
      setSwap(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const candidates = swap
    ? staff.filter(
        (s) =>
          canWork(s, swap.date, swap.shift, isWeekend(swap.date)) &&
          s._id !== swap.staff._id &&
          !items.some((i) => i.date === swap.date && i.staff._id === s._id)
      )
    : [];

  const cell = (date, shift) => (
    <td className="align-top">
      <div className="flex flex-wrap gap-1">
        {(byCell[`${date}:${shift}`] || []).map((a) =>
          isAdmin ? (
            <button key={a._id} className="badge badge-primary badge-soft hover:badge-primary" onClick={() => setSwap(a)}>
              {a.staff.name}
            </button>
          ) : (
            <span key={a._id} className="badge badge-primary badge-soft">{a.staff.name}</span>
          )
        )}
        {!byCell[`${date}:${shift}`] && <span className="opacity-30">—</span>}
      </div>
    </td>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Duty Roster</h1>

      <div className="card bg-base-100 shadow">
        <div className="card-body gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="form-control">
              <span className="label-text text-xs mb-1">From</span>
              <input type="date" className="input input-bordered input-sm" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
            </label>
            <label className="form-control">
              <span className="label-text text-xs mb-1">To</span>
              <input type="date" className="input input-bordered input-sm" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
            </label>
            {isAdmin && (
              <>
                <label className="form-control">
                  <span className="label-text text-xs mb-1">Morning staff</span>
                  <input type="number" min="0" max="10" className="input input-bordered input-sm w-24" value={slots.morning} onChange={(e) => setSlots((s) => ({ ...s, morning: +e.target.value }))} />
                </label>
                <label className="form-control">
                  <span className="label-text text-xs mb-1">Evening staff</span>
                  <input type="number" min="0" max="10" className="input input-bordered input-sm w-24" value={slots.evening} onChange={(e) => setSlots((s) => ({ ...s, evening: +e.target.value }))} />
                </label>
                <button className="btn btn-primary btn-sm" onClick={generate} disabled={generating || !days.length}>
                  {generating ? <span className="loading loading-spinner loading-xs" /> : <Sparkles size={16} />} Generate
                </button>
                <button className="btn btn-ghost btn-sm text-error" onClick={clear} disabled={!items.length}>
                  <Trash2 size={16} /> Clear range
                </button>
              </>
            )}
          </div>
          <p className="text-xs opacity-70">
            Rules applied: morning {SHIFTS.morning.time}, evening {SHIFTS.evening.time} (female staff only); weekends only for staff who stay on the compound; management is excluded.
          </p>
        </div>
      </div>

      {warnings.length > 0 && (
        <div role="alert" className="alert alert-warning">
          <div>
            <p className="font-semibold">Some slots could not be filled</p>
            <ul className="text-sm list-disc ml-5">
              {warnings.slice(0, 6).map((w) => <li key={w.date + w.shift}>{w.message}</li>)}
              {warnings.length > 6 && <li>…and {warnings.length - 6} more</li>}
            </ul>
          </div>
        </div>
      )}

      {range.from > range.to && <div className="alert alert-error">The end date must be after the start date.</div>}

      <div className="card bg-base-100 shadow overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Morning <span className="font-normal opacity-60">{SHIFTS.morning.time}</span></th>
              <th>Evening <span className="font-normal opacity-60">{SHIFTS.evening.time}</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={3} className="text-center py-8"><span className="loading loading-spinner text-primary" /></td></tr>}
            {!loading && days.length === 0 && <tr><td colSpan={3} className="text-center py-8 opacity-70">Pick a valid date range (max 92 days).</td></tr>}
            {!loading &&
              days.map((d) => (
                <tr key={d} className={isWeekend(d) ? 'bg-base-200' : ''}>
                  <td className="whitespace-nowrap font-medium">
                    {prettyDate(d)} {d === todayStr() && <span className="badge badge-accent badge-xs ml-1">today</span>}
                  </td>
                  {cell(d, 'morning')}
                  {cell(d, 'evening')}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {swap && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Reassign duty</h3>
            <p className="text-sm opacity-70 mb-3">
              {prettyDate(swap.date)} · {SHIFTS[swap.shift].label} · currently <b>{swap.staff.name}</b>
            </p>
            {candidates.length === 0 ? (
              <p className="opacity-70">No other eligible staff are free on this day.</p>
            ) : (
              <ul className="menu bg-base-200 rounded-box max-h-72 overflow-y-auto flex-nowrap">
                {candidates.map((s) => (
                  <li key={s._id}>
                    <button onClick={() => reassign(s._id)}>
                      {s.name} {s.staysOnCompound && <span className="badge badge-xs badge-ghost">compound</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-action justify-between">
              <button className="btn btn-ghost text-error" onClick={removeSlot}>Remove slot</button>
              <button className="btn" onClick={() => setSwap(null)}>Close</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSwap(null)} />
        </dialog>
      )}
    </div>
  );
}
