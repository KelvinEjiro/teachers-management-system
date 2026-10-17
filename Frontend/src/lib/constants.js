// Same order the management assembly rotation follows
export const POSITIONS = [
  { value: 'principal', label: 'Principal' },
  { value: 'vp_admin', label: 'Vice Principal (Admin)' },
  { value: 'vp_academics', label: 'Vice Principal (Academics)' },
  { value: 'senior_dean', label: 'Senior Dean' },
  { value: 'junior_dean', label: 'Junior Dean' },
];

export const positionLabel = (v) => POSITIONS.find((p) => p.value === v)?.label || '—';

export const SHIFTS = {
  morning: { label: 'Morning', time: '7:00am – 3:00pm' },
  evening: { label: 'Evening', time: '5:00pm – 8:30pm' },
};

// Mirrors the server's rules so the UI only offers valid choices (the server still enforces them)
export const canWork = (staff, date, shift, isWeekendDay) =>
  staff.isActive &&
  staff.staffType === 'teaching' &&
  !(shift === 'evening' && staff.gender !== 'female') &&
  !(isWeekendDay && !staff.staysOnCompound);
