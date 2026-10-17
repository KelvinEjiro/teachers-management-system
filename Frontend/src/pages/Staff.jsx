import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { positionLabel } from '../lib/constants';
import StaffModal from '../components/StaffModal.jsx';

export default function Staff() {
  const { isAdmin } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | staff object
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setStaff((await api.get('/staff')).data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.name}? Their duty and assembly assignments will be removed too.`)) return;
    try {
      await api.delete(`/staff/${s._id}`);
      toast.success(`${s.name} deleted`);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const shown = staff.filter((s) => filter === 'all' || s.staffType === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Staff</h1>
        <div className="flex gap-2">
          <select className="select select-bordered select-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All staff</option>
            <option value="teaching">Teaching</option>
            <option value="management">Management</option>
          </select>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}>
              <Plus size={16} /> Add staff
            </button>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Gender</th>
              <th>On compound</th>
              <th>Status</th>
              {isAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-8"><span className="loading loading-spinner text-primary" /></td></tr>
            )}
            {!loading && shown.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 opacity-70">No staff yet.</td></tr>
            )}
            {shown.map((s) => (
              <tr key={s._id} className={s.isActive ? '' : 'opacity-50'}>
                <td>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs opacity-60">{s.email}</div>
                </td>
                <td>
                  {s.staffType === 'management' ? (
                    <span className="badge badge-secondary badge-outline">{positionLabel(s.position)}</span>
                  ) : (
                    <span className="badge badge-ghost">Teaching</span>
                  )}
                </td>
                <td className="capitalize">{s.gender}</td>
                <td>{s.staysOnCompound ? 'Yes' : 'No'}</td>
                <td>
                  <span className={`badge ${s.isActive ? 'badge-success' : 'badge-error'} badge-soft`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {s.role === 'admin' && <span className="badge badge-primary badge-soft ml-1">Admin</span>}
                </td>
                {isAdmin && (
                  <td className="text-right whitespace-nowrap">
                    <button className="btn btn-ghost btn-xs" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-xs text-error" aria-label={`Delete ${s.name}`} onClick={() => remove(s)}><Trash2 size={14} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <StaffModal
          staff={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

