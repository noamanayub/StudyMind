import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pencil, Share2 } from "lucide-react";
import { useResource } from "../hooks/useResource";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import { ErrorNotice, Loading } from "../components/common/Feedback";
import ContentEditor from "../components/study/ContentEditor";
import ResourceActions from "../components/study/ResourceActions";
import StudySources from "../components/study/StudySources";
import ShareNoteDialog from "../components/study/ShareNoteDialog";
export default function StudyContent({ notes = false }) {
  const { id } = useParams(),
    tab = notes ? "notes" : "summaries",
    endpoint = `/${tab}`;
  const resource = useResource(`${endpoint}/${id}`),
    [edit, setEdit] = useState(false),
    [share, setShare] = useState(false);
  if (resource.error)
    return <ErrorNotice message={resource.error} retry={resource.reload} />;
  if (resource.loading || !resource.data) return <Loading />;
  const record = resource.data;
  return (
    <>
      <Link className="back-link" to={`/app/study?tab=${tab}`}>
        ← Your {notes ? "study notes" : "summaries"}
      </Link>
      <PageHeader
        eyebrow={
          notes
            ? "YOUR WORDS. YOUR UNDERSTANDING."
            : record.format.replaceAll("_", " ")
        }
        title={record.title}
        action={
          notes ? (
            <div className="resource-actions">
              {record.shareRole === "OWNER" && (
                <Button variant="secondary" onClick={() => setShare(true)}>
                  <Share2 size={16} /> Share note
                </Button>
              )}
              {record.shareRole === "OWNER" && (
                <ResourceActions record={record} endpoint={endpoint} tab={tab} onChange={resource.reload} />
              )}
            </div>
          ) : (
            <ResourceActions record={record} endpoint={endpoint} tab={tab} onChange={resource.reload} />
          )
        }
      />
      <div className="study-reading-panel">
        <div className="section-title">
          <p className="muted">
            {record.shareRole !== "OWNER"
              ? `Shared by ${record.sharedBy} · ${record.shareRole.toLowerCase()}`
              : record.edited
              ? "Personal study content · edited"
              : "Generated from your study material"}
          </p>
          {record.shareRole !== "VIEWER" && (
            <Button variant="secondary" onClick={() => setEdit(true)}>
              <Pencil size={16} />
              Edit content
            </Button>
          )}
        </div>
        <div className="study-content">{record.content}</div>
      </div>
      <StudySources record={record} />
      {edit && (
        <ContentEditor
          record={record}
          endpoint={endpoint}
          onSaved={resource.setData}
          onClose={() => setEdit(false)}
        />
      )}
      {share && <ShareNoteDialog note={record} onClose={() => setShare(false)} />}
    </>
  );
}
