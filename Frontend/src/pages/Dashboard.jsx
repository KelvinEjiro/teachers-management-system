import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errorMessage } from '../lib/api';
import { positionLabel, SHIFTS } from '../lib/constants';
import { prettyDate } from '../lib/dates';

const Stat = ({ title, value, desc }) => (
  <div className="stat">
    <div className="stat-title">{title}</div>
    <div className="stat-value text-primary">{value}</div>
    {desc && <div className="stat-desc">{desc}</div>}
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => toast.error(errorMessage(err)));
  }, []);

  if (!data) return <span className="loading loading-spinner loading-lg text-primary" />;
  const { staff, dutyToday, assemblyLead, today } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="opacity-70">{prettyDate(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="stats stats-vertical sm:stats-horizontal shadow w-full bg-base-100">
        <Stat title="Active staff" value={staff.total} desc={`${staff.female} female · ${staff.male} male`} />
        <Stat title="Teaching" value={staff.teaching} />
        <Stat title="Management" value={staff.management} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Duty today</h2>
            {dutyToday.length === 0 ? (
              <p className="opacity-70">No duty roster has been generated for today.</p>
            ) : (
              ['morning', 'evening'].map((shift) => (
                <div key={shift}>
                  <p className="text-sm font-semibold">
                    {SHIFTS[shift].label} <span className="font-normal opacity-60">· {SHIFTS[shift].time}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {dutyToday.filter((d) => d.shift === shift).map((d) => (
                      <span key={d._id} className="badge badge-primary badge-lg">{d.staff.name}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Assembly this week</h2>
            {assemblyLead ? (
              <>
                <p className="text-xl font-semibold">{assemblyLead.staff.name}</p>
                <p className="opacity-70">{positionLabel(assemblyLead.position)}</p>
              </>
            ) : (
              <p className="opacity-70">No assembly roster for this week yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
