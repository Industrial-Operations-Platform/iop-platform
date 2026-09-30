import { useState } from "react";
import {
  Actions,
  Alert,
  Button,
  Dialog,
  Field,
  Input,
} from "../../../../design/components";
import { t } from "../../../../localization/i18n";
export function EditNameDialog({
  name,
  save,
  close,
}: {
  name: string;
  save: (name: string) => Promise<void>;
  close: () => void;
}) {
  const [value, setValue] = useState(name),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  return (
    <Dialog title={t("Edit name")} onClose={close} busy={pending}>
      <form
        className="access-name-form"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          void save(value.trim())
            .then(close)
            .catch((reason) => setError(reason.message))
            .finally(() => setPending(false));
        }}
      >
        {error && <Alert>{t(error)}</Alert>}
        <Field>
          {t("Name")}
          <Input
            aria-label={t("Name")}
            autoComplete="name"
            required
            maxLength={100}
            value={value}
            disabled={pending}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <Actions>
          <Button
            type="submit"
            disabled={pending || !value.trim() || value.trim() === name}
          >
            {t("Save")}
          </Button>
          <Button variant="text" disabled={pending} onClick={close}>
            {t("Cancel")}
          </Button>
        </Actions>
      </form>
    </Dialog>
  );
}
