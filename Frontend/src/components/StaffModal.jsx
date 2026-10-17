import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../lib/api';
import { POSITIONS } from '../lib/constants';

export default function StaffModal({ staff, onClose, onSaved }) {
  const editing = !!staff;
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    password: '',
    gender: staff?.gender || 'female',
    staffType: staff?.staffType || 'teaching',
    position: staff?.position || POSITIONS[0].value,
    staysOnCompound: staff?.staysOnCompound || false,
    phone: staff?.phone || '',
    role: staff?.role || 'staff',
    isActive: staff?.isActive ?? true,
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form };
    if (payload.staffType !== 'management') delete payload.position;
    if (!payload.password) delete payload.password;
    try {
      if (editing) await api.put(`/staff/${staff._id}`, payload);
      else await api.post('/staff', payload);
      toast.success(editing ? 'Staff updated' : 'Staff added');
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <form className="modal-box space-y-3" onSubmit={submit}>
        <h3 className="font-bold text-lg">{editing ? 'Edit staff' : 'Add staff'}</h3>

        <input className="input input-bordered w-full" placeholder="Full name" required value={form.name} onChange={set('name')} />
        <input type="email" className="input input-bordered w-full" placeholder="Email" required value={form.email} onChange={set('email')} />
        <input
          type="password"
          className="input input-bordered w-full"
          placeholder={editing ? 'New password (leave blank to keep)' : 'Password (min 6 characters)'}
          required={!editing}
          minLength={6}
          value={form.password}
          onChange={set('password')}
        />
        <input className="input input-bordered w-full" placeholder="Phone (optional)" value={form.phone} onChange={set('phone')} />

        <div className="grid grid-cols-2 gap-3">
          <select className="select select-bordered w-full" value={form.gender} onChange={set('gender')}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          <select className="select select-bordered w-full" value={form.staffType} onChange={set('staffType')}>
            <option value="teaching">Teaching staff</option>
            <option value="management">Management</option>
          </select>
        </div>

        {form.staffType === 'management' && (
          <select className="select select-bordered w-full" value={form.position} onChange={set('position')}>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        )}

        <select className="select select-bordered w-full" value={form.role} onChange={set('role')}>
          <option value="staff">Role: Staff (view only)</option>
          <option value="admin">Role: Admin (can manage)</option>
        </select>

        <label className="label cursor-pointer justify-start gap-3">
          <input type="checkbox" className="checkbox checkbox-primary" checked={form.staysOnCompound} onChange={set('staysOnCompound')} />
          <span>Stays on the school compound (eligible for weekend duty)</span>
        </label>
        {editing && (
          <label className="label cursor-pointer justify-start gap-3">
            <input type="checkbox" className="checkbox checkbox-primary" checked={form.isActive} onChange={set('isActive')} />
            <span>Active</span>
          </label>
        )}

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>
            {busy && <span className="loading loading-spinner loading-sm" />} Save
          </button>
        </div>
      </form>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
