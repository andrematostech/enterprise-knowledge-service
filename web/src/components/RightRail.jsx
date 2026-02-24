import Panel from "./Panel.jsx";
import Button from "./Button.jsx";

export default function RightRail({ statusRows, tips, announcements, onAnnouncementsClick }) {
  return (
    <aside className="right_rail">
      <Panel title="Status" subtitle="System overview">
        <div className="list">
          {statusRows.map((row) => (
            <div key={row.label} className="list_row">
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Tips" subtitle="Quick guidance">
        <div className="list">
          {tips.map((tip) => (
            <div key={tip} className="list_row">
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Announcements"
        subtitle="Latest broadcasts"
        action={
          <Button variant="ghost" size="sm" onClick={onAnnouncementsClick}>
            View all
          </Button>
        }
      >
        <div className="announcement_tiles">
          {announcements.map((item) => (
            <div key={item.id} className="announcement_tile">
              <div className="announcement_tile_header">
                <div className="announcement_tile_meta">
                  <div className="avatar">
                    {item.avatar ? <img src={item.avatar} alt="Avatar" /> : item.initials}
                  </div>
                  <span>{item.sender}</span>
                </div>
                <span className="announcement_tile_time">{item.time}</span>
              </div>
              <div>
                <strong>{item.title}</strong>
              </div>
              <div>{item.preview}</div>
            </div>
          ))}
        </div>
      </Panel>
    </aside>
  );
}
