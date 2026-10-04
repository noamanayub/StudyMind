import { useId } from "react";
import { Link } from "react-router-dom";
import { useCollection } from "../../hooks/useCollection";
import { ErrorNotice, Loading } from "../common/Feedback";
export default function MaterialPicker({ value, onChange, disabled }) {
  const id = useId();
  const workspaces = useCollection("/workspaces"),
    documents = useCollection("/documents?ready=true");
  if (workspaces.error || documents.error)
    return <ErrorNotice message={workspaces.error || documents.error} />;
  if (!workspaces.data || !documents.data) return <Loading />;
  const update = (patch) => onChange({ ...value, ...patch });
  return (
    <fieldset className="material-picker" disabled={disabled}>
      <legend>Choose your study material</legend>
      <label htmlFor={`${id}-scope`}>Material scope</label>
      <select
        id={`${id}-scope`}
        value={value.scope}
        onChange={(e) => update({ scope: e.target.value })}
      >
        <option value="documents">Selected documents</option>
        <option value="workspace">A workspace</option>
        <option value="all">All my knowledge</option>
      </select>
      {value.scope === "workspace" && (
        <div className="field">
          <label htmlFor={`${id}-workspace`}>Workspace</label>
          <select
            id={`${id}-workspace`}
            required
            value={value.workspaceId}
            onChange={(e) => update({ workspaceId: e.target.value })}
          >
            <option value="">Choose a workspace</option>
            {workspaces.data.items.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {value.scope === "documents" && (
        <div className="material-choices" data-lenis-prevent>
          {documents.data.items.map((d) => (
            <label key={d.id}>
              <input
                type="checkbox"
                checked={value.documentIds.includes(d.id)}
                onChange={(e) =>
                  update({
                    documentIds: e.target.checked
                      ? [...value.documentIds, d.id]
                      : value.documentIds.filter((id) => id !== d.id),
                  })
                }
              />
              <span>{d.originalName}</span>
            </label>
          ))}
        </div>
      )}
      {!documents.data.items.length && (
        <p className="muted">
          You need ready documents to generate study resources.{" "}
          <Link className="text-button" to="/app/knowledge">
            Add material
          </Link>
        </p>
      )}
      <small className="muted">
        For focused results, choose a few related documents. Larger documents
        use a representative selection of passages.
      </small>
    </fieldset>
  );
}
