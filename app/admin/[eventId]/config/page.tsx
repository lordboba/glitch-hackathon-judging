import { updateEventAction } from "@/app/admin/actions";
import CsvImportPanel from "@/components/csv-import-panel";
import { getEventConfig } from "@/lib/server/events";

export default async function ConfigPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  const saved = sp.saved === "event";
  const event = await getEventConfig(eventId);

  if (!event) return null;

  return (
    <div className="admin-dashboard">
      <div>
        <p className="eyebrow">Configuration</p>
        <h2>Event settings</h2>
      </div>

      {saved ? <p className="inline-note">Event saved.</p> : null}

      <div className="card admin-section">
        <form action={updateEventAction} className="stack-form">
          <input name="eventId" type="hidden" value={event.id} />
          <div className="admin-grid-two">
            <label>
              <span>Name</span>
              <input defaultValue={event.name} name="name" required type="text" />
            </label>
            <label>
              <span>Host organization</span>
              <input defaultValue={event.hostOrganization} name="hostOrganization" required type="text" />
            </label>
            <label>
              <span>Format</span>
              <select defaultValue={event.format} name="format">
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </label>
            <label>
              <span>Audience</span>
              <select defaultValue={event.audience} name="audience">
                <option value="invited">Invited</option>
                <option value="application">Application</option>
                <option value="public">Public</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={event.status} name="status">
                <option value="DRAFT">Draft</option>
                <option value="OPEN_INTAKE">Open intake</option>
                <option value="JUDGING_LIVE">Judging live</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>
            <label>
              <span>Timezone</span>
              <input defaultValue={event.timezone} name="timezone" type="text" />
            </label>
            <label>
              <span>Start date</span>
              <input defaultValue={event.startDate} name="startDate" required type="date" />
            </label>
            <label>
              <span>End date</span>
              <input defaultValue={event.endDate} name="endDate" required type="date" />
            </label>
            <label>
              <span>Location</span>
              <input defaultValue={event.location} name="location" required type="text" />
            </label>
            <label>
              <span>Judge count target</span>
              <input defaultValue={event.judgeCount} min="1" name="judgeCount" type="number" />
            </label>
          </div>
          <label>
            <span>Tracks</span>
            <input defaultValue={event.tracks.join(", ")} name="tracks" type="text" />
          </label>
          <label>
            <span>Organizer goal</span>
            <textarea defaultValue={event.organizerGoal} name="organizerGoal" rows={4} />
          </label>
          <button className="button button-primary" type="submit">
            Save event
          </button>
        </form>
      </div>

      <CsvImportPanel eventId={event.id} />
    </div>
  );
}
