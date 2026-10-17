import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { POSITIONS, positionLabel } from '../lib/constants';
import { addDays, mondayOf, prettyDate, todayStr } from '../lib/dates';

export default function MgtRoster() {
  const { isAdmin } = useAuth();
  const thisMonday = mondayOf(todayStr());
  const [form, setForm] = useState({ startDate: thisMonday, weeks: 10, startPosition: '' });
  const [items, setItems] = useState([]);
  const [mgtStaff, setMgtStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [roster, staff] = await Promise.all([
        api.get('/mgt', { params: { from: addDays(thisMonday, -28), to: addDays(thisMonday, 7 * 52) } }),
        api.get('/staff', { params: { staffType: 'management', active: true } }),
      ]);
      setItems(roster.data);
      setMgtStaff(staff.data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [thisMonday]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { startDate: form.startDate, weeks: Number(form.weeks) };
      if (form.startPosition) payload.startPosition = form.startPosition;
      const { data } = await api.post('/mgt/generate', payload);
      toast.success(`Generated ${data.created} assembly weeks`);
      data.warnings.forEach((w) => toast(w, { icon: '⚠️', duration: 6000 }));
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reassign = async (id, staffId) => {
    try {
      await api.patch(`/mgt/${id}`, { staffId });
      toast.success('Assembly lead changed');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/mgt/${id}`);
      toast.success('Week removed');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Assembly Roster</h1>
        <p className="opacity-70 text-sm">Each management member leads assembly for a whole week, then the next person takes over.</p>
      </div>

      {isAdmin && (
        <form className="card bg-base-100 shadow" onSubmit={generate}>
          <div className="card-body flex-row flex-wrap items-end gap-3">
            <label className="form-control">
              <span className="label-text text-xs mb-1">Start week (any day)</span>
              <input type="date" required className="input input-bordered input-sm" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </label>
            <label className="form-control">
              <span className="label-text text-xs mb-1">Weeks</span>
              <input type="number" min="1" max="52" required className="input input-bordered input-sm w-24" value={form.weeks} onChange={(e) => setForm((f) => ({ ...f, weeks: e.target.value }))} />
            </label>
            <label className="form-control">
              <span className="label-text text-xs mb-1">Start with</span>
              <select className="select select-bordered select-sm" value={form.startPosition} onChange={(e) => setForm((f) => ({ ...f, startPosition: e.target.value }))}>
                <option value="">Continue from last week</option>
                {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </label>
            <button className="btn btn-primary btn-sm" disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-xs" /> : <Sparkles size={16} />} Generate
            </button>
          </div>
        </form>
      )}

      <div className="card bg-base-100 shadow overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Week</th><th>Assembly lead</th><th>Position</th>{isAdmin && <th />}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="text-center py-8"><span className="loading loading-spinner text-primary" /></td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={4} className="text-center py-8 opacity-70">No assembly roster yet. Add management staff, then generate one.</td></tr>}
            {items.map((i) => {
              const current = i.weekStart === thisMonday;
              return (
                <tr key={i._id} className={current ? 'bg-primary/10' : ''}>
                  <td className="whitespace-nowrap">
                    {prettyDate(i.weekStart)} – {prettyDate(i.weekEnd)}
                    {current && <span className="badge badge-accent badge-sm ml-2">this week</span>}
                  </td>
                  <td>
                    {isAdmin ? (
                      <select className="select select-ghost select-sm" value={i.staff._id} onChange={(e) => reassign(i._id, e.target.value)}>
                        {mgtStaff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                        {!mgtStaff.some((s) => s._id === i.staff._id) && <option value={i.staff._id}>{i.staff.name}</option>}
                      </select>
                    ) : (
                      i.staff.name
                    )}
                  </td>
                  <td>{positionLabel(i.position)}</td>
                  {isAdmin && (
                    <td className="text-right">
                      <button className="btn btn-ghost btn-xs text-error" aria-label="Remove week" onClick={() => remove(i._id)}><Trash2 size={14} /></button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
