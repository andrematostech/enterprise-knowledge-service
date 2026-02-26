import { useMemo, useState } from "react";
import { FiActivity, FiClock, FiCloud, FiCloudRain, FiDatabase, FiSearch, FiSun } from "react-icons/fi";
import Panel from "../components/Panel.jsx";
import MetricCard from "../components/MetricCard.jsx";
import Button from "../components/Button.jsx";

export default function Home({
  metrics,
  onGoQuery,
  onGoDocuments,
  statusHint,
  calendarMonth,
  onCalendarMonth,
  calendarEvents,
  calendarLoading,
  calendarError,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent
}) {
  const weeklyWeather = [
    { day: "Mon", condition: "sunny", tempC: 22, tempF: 72 },
    { day: "Tue", condition: "cloudy", tempC: 19, tempF: 66 },
    { day: "Wed", condition: "rain", tempC: 17, tempF: 63 },
    { day: "Thu", condition: "cloudy", tempC: 20, tempF: 68 },
    { day: "Fri", condition: "sunny", tempC: 24, tempF: 75 },
    { day: "Sat", condition: "rain", tempC: 18, tempF: 64 },
    { day: "Sun", condition: "sunny", tempC: 23, tempF: 73 }
  ];
  const iconMap = {
    sunny: <FiSun />,
    cloudy: <FiCloud />,
    rain: <FiCloudRain />
  };

  const [selectedDate, setSelectedDate] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventNote, setEventNote] = useState("");
  const [editingId, setEditingId] = useState(null);

  const monthDate = calendarMonth || new Date();
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const monthLabel = monthDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const formatDayKey = (day) => {
    if (!day) return "";
    const monthValue = String(monthIndex + 1).padStart(2, "0");
    const dayValue = String(day).padStart(2, "0");
    return `${year}-${monthValue}-${dayValue}`;
  };

  const eventsByDate = useMemo(() => {
    const grouped = {};
    (calendarEvents || []).forEach((event) => {
      const key = event.date;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, [calendarEvents]);

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const startDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  const calendarCells = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startDay + 1;
    return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null;
  });

  const handleSelectDay = (day) => {
    if (!day) return;
    const key = formatDayKey(day);
    setSelectedDate(key);
    setEditingId(null);
    setEventTitle("");
    setEventTime("");
    setEventNote("");
  };

  const handleEditEvent = (event) => {
    setSelectedDate(event.date);
    setEditingId(event.id);
    setEventTitle(event.title || "");
    setEventTime(event.time ? String(event.time).slice(0, 5) : "");
    setEventNote(event.note || "");
  };

  const handleSubmitEvent = async () => {
    if (!selectedDate || !eventTitle.trim()) return;
    const payload = {
      date: selectedDate,
      time: eventTime || null,
      title: eventTitle.trim(),
      note: eventNote.trim() || null
    };
    if (editingId) {
      const updated = await onUpdateEvent?.(editingId, payload);
      if (updated) {
        setEditingId(null);
        setEventTitle("");
        setEventTime("");
        setEventNote("");
      }
      return;
    }
    const created = await onCreateEvent?.(payload);
    if (created) {
      setEventTitle("");
      setEventTime("");
      setEventNote("");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const deleted = await onDeleteEvent?.(eventId);
    if (deleted && eventId === editingId) {
      setEditingId(null);
      setEventTitle("");
      setEventTime("");
      setEventNote("");
    }
  };

  return (
    <div className="home_layout">
      <Panel title="Overview" subtitle="Workspace pulse" variant="raised">
        <div className="home_panel_body">
          <div className="metric_grid metric_grid--compact">
            {metrics.map((metric) => {
              const iconMap = {
                Documents: <FiDatabase />,
                Queries: <FiSearch />,
                "Last indexed": <FiClock />,
                Latency: <FiActivity />
              };
              return (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  sublabel={metric.sub}
                  icon={iconMap[metric.label]}
                />
              );
            })}
          </div>
        </div>
      </Panel>
      <Panel title="Weekly forecast" subtitle="Current week" variant="sunken">
        <div className="home_panel_body">
          <div className="weekly_forecast">
            {weeklyWeather.map((entry) => (
              <div key={entry.day} className="weekly_forecast_day">
                <div className="weekly_forecast_icon">
                  {iconMap[entry.condition] || <FiCloud />}
                </div>
                <div className="weekly_forecast_label">{entry.day}</div>
                <div className="weekly_forecast_temp">
                  <span>{entry.tempC}°C</span>
                  <span>{entry.tempF}°F</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <div className="home_split">
        <Panel title="Quick actions" subtitle={statusHint} variant="sunken">
          <div className="home_panel_body">
            <div className="home_actions">
              <Button variant="primary" onClick={onGoQuery}>Ask a question</Button>
              <Button variant="secondary" onClick={onGoDocuments}>Upload documents</Button>
            </div>
          </div>
        </Panel>
        <Panel title="Calendar" subtitle={monthLabel} variant="sunken">
          <div className="home_panel_body">
            <div className="calendar">
              <div className="calendar_header">
                <span>{monthLabel}</span>
                <span className="panel_subtitle">{calendarLoading ? "Syncing…" : "Full month"}</span>
              </div>
              <div className="calendar_weekdays">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <span key={day} className="calendar_weekday">{day}</span>
                ))}
              </div>
              <div className="calendar_grid">
                {calendarCells.map((day, index) => {
                  const dateKey = day ? formatDayKey(day) : "";
                  const dayEvents = day ? eventsByDate[dateKey] || [] : [];
                  return (
                    <div
                      key={`${day || "blank"}-${index}`}
                      className={`calendar_day${!day ? " calendar_day--muted" : ""}${selectedDate === dateKey ? " calendar_day--active" : ""}`}
                      onClick={() => handleSelectDay(day)}
                      role="button"
                      tabIndex={day ? 0 : -1}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleSelectDay(day);
                      }}
                    >
                      <span className="calendar_day_value">{day || "—"}</span>
                      {dayEvents.length ? <span className="calendar_day_dot" /> : null}
                      {dayEvents.length ? (
                        <div className="calendar_event_tooltip">
                          <div className="calendar_event_title">{dayEvents[0].title}</div>
                          <div className="calendar_event_note">
                            {dayEvents[0].time ? `${String(dayEvents[0].time).slice(0, 5)} · ` : ""}{dayEvents[0].note || "No note"}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="calendar_editor">
                <div className="calendar_editor_header">
                  <span>{selectedDate ? `Notes for ${selectedDate}` : "Select a day"}</span>
                  {calendarError ? <span className="panel_subtitle">{calendarError}</span> : null}
                </div>
                <div className="calendar_editor_body">
                  {selectedEvents.length ? (
                    <div className="calendar_events">
                      {selectedEvents.map((event) => (
                        <div key={event.id} className="calendar_event_row">
                          <div>
                            <div className="calendar_event_title">{event.title}</div>
                            <div className="panel_subtitle">
                              {event.time ? String(event.time).slice(0, 5) : "Anytime"} · {event.note || "No note"}
                            </div>
                          </div>
                          <div className="calendar_event_actions">
                            <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)}>Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)}>Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="field">
                    <label>Title</label>
                    <input
                      className="input"
                      value={eventTitle}
                      onChange={(event) => setEventTitle(event.target.value)}
                      placeholder="Add a reminder"
                    />
                  </div>
                  <div className="field">
                    <label>Time</label>
                    <input
                      className="input"
                      type="time"
                      value={eventTime}
                      onChange={(event) => setEventTime(event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Note</label>
                    <textarea
                      className="textarea"
                      value={eventNote}
                      onChange={(event) => setEventNote(event.target.value)}
                      placeholder="Add details"
                    />
                  </div>
                  <div className="calendar_editor_actions">
                    <Button variant="primary" onClick={handleSubmitEvent} disabled={!selectedDate}>
                      {editingId ? "Update note" : "Save note"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingId(null);
                        setEventTitle("");
                        setEventTime("");
                        setEventNote("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
