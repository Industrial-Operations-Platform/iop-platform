import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Field,
  Input,
  Select,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
import type { Content, Context } from "../../domain/models";
import { prepareImage } from "../browser/image-attachment";
export function EntryMediaFields({
  value,
  context,
  change,
  reading,
}: {
  value: Content;
  context: Context;
  change: (value: Content) => void;
  reading: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <Field>
        {t("Mention people")}
        <Select
          aria-label={t("Mention people")}
          value=""
          disabled={(value.mentionIds?.length ?? 0) >= 20}
          onChange={(e) => {
            if (e.target.value)
              change({
                ...value,
                mentionIds: [...(value.mentionIds ?? []), e.target.value],
              });
          }}
        >
          <option value="">{t("Choose a person to notify")}</option>
          {context.people
            .filter((p) => !value.mentionIds?.includes(p.id))
            .map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
        </Select>
      </Field>
      <div className="handover-card-tags">
        {value.mentionIds?.map((id) => (
          <Badge key={id}>
            {context.people.find((p) => p.id === id)?.name || id}
            <Button
              variant="text"
              aria-label={t("Remove mention {0}", [
                context.people.find((p) => p.id === id)?.name || id,
              ])}
              onClick={() =>
                change({
                  ...value,
                  mentionIds: value.mentionIds?.filter(
                    (person) => person !== id,
                  ),
                })
              }
            >
              ×
            </Button>
          </Badge>
        ))}
      </div>
      <p className="handover-muted">
        {t(
          "Mentioned people receive a notification when this entry is published or updated.",
        )}
      </p>
      {context.canCoordinate && (
        <Field>
          {t("Images")}
          <Input
            type="file"
            aria-label={t("Attach images")}
            accept="image/png,image/jpeg,image/webp"
            multiple
            disabled={busy || (value.images?.length ?? 0) >= 2}
            onChange={async (event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              setError("");
              if (files.length + (value.images?.length ?? 0) > 2) {
                setError("Attach up to two images.");
                return;
              }
              setBusy(true);
              reading(true);
              try {
                const images = await Promise.all(files.map(prepareImage));
                change({
                  ...value,
                  images: [...(value.images ?? []), ...images],
                });
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
                reading(false);
              }
            }}
          />
          <span className="handover-muted">
            {t("Up to two images. Large images are resized automatically.")}
          </span>
        </Field>
      )}
      {busy && <p role="status">{t("Preparing images…")}</p>}
      {error && <Alert>{t(error)}</Alert>}
      <div className="handover-images">
        {value.images?.map((image, index) => (
          <figure key={index}>
            <img src={image.dataUrl} alt={image.name} />
            <figcaption>{image.name}</figcaption>
            <Button
              variant="text"
              onClick={() =>
                change({
                  ...value,
                  images: value.images?.filter((_, i) => i !== index),
                })
              }
            >
              {t("Remove image")}
            </Button>
          </figure>
        ))}
      </div>
    </>
  );
}
