import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, setup } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', gender: 'female' });

  useEffect(() => {
    api
      .get('/auth/setup-status')
      .then((res) => setNeedsSetup(res.data.needsSetup))
      .catch((err) => {
        setNeedsSetup(false);
        toast.error(errorMessage(err));
      });
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (needsSetup) {
        await setup(form);
        toast.success('Admin account created. Welcome!');
      } else {
        await login(form.email, form.password);
        toast.success('Welcome back');
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-base-200">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <form className="card-body gap-3" onSubmit={submit}>
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap size={32} />
            <h1 className="text-2xl font-bold">Teachers Management</h1>
          </div>

          {needsSetup === null ? (
            <div className="py-8 grid place-items-center">
              <span className="loading loading-spinner text-primary" />
            </div>
          ) : (
            <>
              <p className="text-sm opacity-70">
                {needsSetup ? 'First time here. Create the administrator account to get started.' : 'Log in to manage rosters.'}
              </p>

              {needsSetup && (
                <>
                  <label className="floating-label">
                    <span>Full name</span>
                    <input className="input input-bordered w-full" placeholder="Full name" required value={form.name} onChange={set('name')} />
                  </label>
                  <select className="select select-bordered w-full" value={form.gender} onChange={set('gender')}>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </>
              )}

              <label className="floating-label">
                <span>Email</span>
                <input type="email" className="input input-bordered w-full" placeholder="Email" required value={form.email} onChange={set('email')} />
              </label>
              <label className="floating-label">
                <span>Password</span>
                <input type="password" className="input input-bordered w-full" placeholder="Password" required minLength={6} value={form.password} onChange={set('password')} />
              </label>

              <button className="btn btn-primary mt-2" disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />}
                {needsSetup ? 'Create admin account' : 'Log in'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
