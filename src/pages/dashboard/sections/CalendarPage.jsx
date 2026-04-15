import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchPendingApprovalDrafts,
  fetchPublishedPosts,
  fetchReadyToPublishDrafts,
  mapPendingApprovalDraftRow,
  mapPublishedPostRow,
  mapReadyToPublishDraftRow,
} from '../../../features/content/contentDraftsApi.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LEGEND = [
  { id: 'draft', label: 'Draft' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' },
];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' },
];

function buildGridCells(year, monthIndex) {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ kind: 'pad', key: `pad-start-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ kind: 'day', day, key: `day-${day}` });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ kind: 'pad', key: `pad-end-${cells.length}` });
  }
  while (cells.length < 42) {
    cells.push({ kind: 'pad', key: `pad-fill-${cells.length}` });
  }
  return cells;
}

function isInMonth(isoLike, year, monthIndex) {
  if (!isoLike) return false;
  const d = new Date(isoLike);
  return !Number.isNaN(d.getTime()) && d.getUTCFullYear() === year && d.getUTCMonth() === monthIndex;
}

function getUtcDay(isoLike) {
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCDate();
}

function formatWhen(isoLike) {
  if (!isoLike) return '—';
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CalendarPage() {
  const now = new Date();
  const [view, setView] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [filter, setFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState(() => now.getDate());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const year = view.getFullYear();
  const monthIndex = view.getMonth();

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
        new Date(year, monthIndex, 1),
      ),
    [year, monthIndex],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    let firstError = '';
    const [drafts, ready, published] = await Promise.all([
      fetchPendingApprovalDrafts(),
      fetchReadyToPublishDrafts(),
      fetchPublishedPosts(),
    ]);

    const next = [];

    if (drafts.ok) {
      for (const row of drafts.items.map(mapPendingApprovalDraftRow)) {
        if (!row?.id || !row.createdAtUtc) continue;
        next.push({
          id: row.id,
          title: row.title || 'Untitled',
          status: 'draft',
          whenUtc: row.createdAtUtc,
        });
      }
    } else {
      firstError = firstError || drafts.error;
    }

    if (ready.ok) {
      for (const row of ready.items.map(mapReadyToPublishDraftRow)) {
        if (!row?.id || String(row.status).toLowerCase() !== 'scheduled') continue;
        const whenUtc = row.scheduledPublishAtUtc ?? row.updatedAtUtc ?? row.createdAtUtc;
        if (!whenUtc) continue;
        next.push({
          id: row.id,
          title: row.title || 'Untitled',
          status: 'scheduled',
          whenUtc,
        });
      }
    } else {
      firstError = firstError || ready.error;
    }

    if (published.ok) {
      for (const row of published.items.map(mapPublishedPostRow)) {
        if (!row?.id || !row.publishedAtUtc) continue;
        next.push({
          id: row.id,
          title: row.title || 'Untitled',
          status: 'published',
          whenUtc: row.publishedAtUtc,
        });
      }
    } else {
      firstError = firstError || published.error;
    }

    setItems(next);
    setError(firstError);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const postsByDay = useMemo(() => {
    /** @type {Record<number, Array<{id:string,title:string,status:'draft'|'scheduled'|'published',whenUtc:string}>>} */
    const byDay = {};
    for (const item of items) {
      if (!isInMonth(item.whenUtc, year, monthIndex)) continue;
      const day = getUtcDay(item.whenUtc);
      if (!day) continue;
      byDay[day] ??= [];
      byDay[day].push(item);
    }
    return byDay;
  }, [items, year, monthIndex]);

  const selectedDayItems = useMemo(() => {
    const list = postsByDay[selectedDay] ?? [];
    if (filter === 'all') return list;
    return list.filter((x) => x.status === filter);
  }, [postsByDay, selectedDay, filter]);

  const cells = useMemo(() => buildGridCells(year, monthIndex), [year, monthIndex]);

  useEffect(() => {
    const last = new Date(year, monthIndex + 1, 0).getDate();
    setSelectedDay((d) => Math.min(Math.max(1, d), last));
  }, [year, monthIndex]);

  const today = new Date();
  const isTodayMonth = today.getFullYear() === year && today.getMonth() === monthIndex;
  const todayDate = today.getDate();

  function shiftMonth(delta) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  function visiblePosts(list) {
    if (!list?.length) return [];
    if (filter === 'all') return list;
    return list.filter((p) => p.status === filter);
  }

  return (
    <section className="dashboard-calendar" aria-labelledby="dashboard-calendar-title">
      <header className="dashboard-calendar__toolbar">
        <h1 id="dashboard-calendar-title" className="dashboard-calendar__title">
          Calendar
        </h1>
        <div className="dashboard-calendar__toolbar-right">
          <label htmlFor="dashboard-calendar-filter" className="visually-hidden">
            Filter posts
          </label>
          <select
            id="dashboard-calendar-filter"
            className="dashboard-calendar__select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="dashboard-calendar__select"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh calendar data"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <div className="dashboard-calendar__month-wrap">
            <button
              type="button"
              className="dashboard-calendar__month-btn"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <p className="dashboard-calendar__month-label" role="status">
              {monthLabel}
            </p>
            <button
              type="button"
              className="dashboard-calendar__month-btn"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <p className="content-studio-error" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="dashboard-calendar__legend" aria-label="Post status legend">
        {LEGEND.map((item) => (
          <li key={item.id}>
            <span className={`dashboard-calendar__swatch dashboard-calendar__swatch--${item.id}`} />
            {item.label}
          </li>
        ))}
      </ul>

      <div className="dashboard-calendar__sheet">
        <div className="dashboard-calendar__grid" aria-label={`${monthLabel} calendar`}>
          {WEEKDAYS.map((d) => (
            <div key={d} className="dashboard-calendar__weekday">
              {d}
            </div>
          ))}
          {cells.map((cell, idx) => {
            if (cell.kind === 'pad') {
              return (
                <div
                  key={cell.key}
                  className="dashboard-calendar__cell dashboard-calendar__cell--empty"
                  aria-hidden="true"
                />
              );
            }
            const { day } = cell;
            const raw = postsByDay[day] || [];
            const list = visiblePosts(raw);
            const isToday = isTodayMonth && day === todayDate;
            const isSelected = day === selectedDay;
            const altBand = day % 10 === 1;

            return (
              <div
                key={cell.key}
                className={[
                  'dashboard-calendar__cell',
                  altBand && 'dashboard-calendar__cell--band',
                  isToday && 'dashboard-calendar__cell--today',
                  isSelected && 'dashboard-calendar__cell--selected',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <button
                  type="button"
                  className="dashboard-calendar__day-btn"
                  onClick={() => setSelectedDay(day)}
                  aria-label={`${monthLabel} ${day}`}
                  aria-pressed={isSelected}
                >
                  <span
                    className={[
                      'dashboard-calendar__day-num',
                      isToday && 'dashboard-calendar__day-num--dot',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {day}
                  </span>
                </button>
                {list.length > 0 ? (
                  <ul className="dashboard-calendar__dots" aria-label={`Posts on day ${day}`}>
                    {list.map((p) => (
                      <li key={p.id}>
                        <span
                          className={`dashboard-calendar__dot dashboard-calendar__dot--${p.status}`}
                          title={p.status}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="content-studio-panel content-studio-panel--card" style={{ marginTop: '1rem' }}>
        <h2 className="content-studio-panel__title">Selected day details</h2>
        {selectedDayItems.length === 0 ? (
          <p className="content-studio-muted">No matching items for this day and filter.</p>
        ) : (
          <ul className="content-studio-list">
            {selectedDayItems.map((item) => (
              <li key={`${item.status}-${item.id}-${item.whenUtc}`} className="content-studio-list__item">
                <div>
                  <strong>{item.title}</strong>
                  <p className="content-studio-muted">{formatWhen(item.whenUtc)}</p>
                </div>
                <span className="content-studio-muted" style={{ textTransform: 'capitalize' }}>
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
