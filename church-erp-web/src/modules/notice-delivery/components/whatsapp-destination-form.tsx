"use client";

import { useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ChurchItem } from "@/modules/churches/types/church";
import type {
  CreateWhatsappDestinationPayload,
  WhatsappDestinationFormValues,
  WhatsappDestinationItem,
} from "@/modules/notice-delivery/types/whatsapp";

interface WhatsappDestinationFormProps {
  churches: ChurchItem[];
  destination?: WhatsappDestinationItem | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateWhatsappDestinationPayload) => Promise<void>;
}

const initialFormValues: WhatsappDestinationFormValues = {
  type: "GROUP",
  label: "",
  churchId: "",
  groupId: "",
  phoneNumber: "",
  enabled: true,
};

function buildFormValues(
  destination?: WhatsappDestinationItem | null,
): WhatsappDestinationFormValues {
  if (!destination) {
    return initialFormValues;
  }

  return {
    type: destination.type,
    label: destination.label,
    churchId: destination.churchId ?? "",
    groupId: destination.groupId ?? "",
    phoneNumber: destination.phoneNumber ?? "",
    enabled: destination.enabled,
  };
}

export function WhatsappDestinationForm({
  churches,
  destination,
  isSubmitting,
  onCancel,
  onSubmit,
}: WhatsappDestinationFormProps) {
  const [formValues, setFormValues] = useState<WhatsappDestinationFormValues>(() =>
    buildFormValues(destination),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleFieldChange(
    field: keyof WhatsappDestinationFormValues,
    value: string | boolean,
  ) {
    setFormValues((current) => {
      if (field === "type" && value === "GROUP") {
        return {
          ...current,
          type: "GROUP",
          phoneNumber: "",
        };
      }

      if (field === "type" && value === "PERSON") {
        return {
          ...current,
          type: "PERSON",
          groupId: "",
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!formValues.label.trim()) {
      setSubmitError("Informe um nome para este grupo ou contato.");
      return;
    }

    if (formValues.type === "GROUP" && !formValues.groupId.trim()) {
      setSubmitError("Informe o codigo do grupo.");
      return;
    }

    if (formValues.type === "PERSON" && !formValues.phoneNumber.trim()) {
      setSubmitError("Informe o numero do contato.");
      return;
    }

    try {
      await onSubmit({
        type: formValues.type,
        label: formValues.label,
        churchId: formValues.churchId || null,
        groupId: formValues.type === "GROUP" ? formValues.groupId : null,
        phoneNumber:
          formValues.type === "PERSON" ? formValues.phoneNumber : null,
        enabled: formValues.enabled,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Nao foi possivel salvar este grupo ou contato agora.";
      setSubmitError(message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="whatsapp-destination-type">Tipo</Label>
          <Select
            id="whatsapp-destination-type"
            value={formValues.type}
            onChange={(event) => handleFieldChange("type", event.target.value)}
            disabled={isSubmitting}
          >
            <option value="GROUP">Grupo</option>
            <option value="PERSON">Contato individual</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp-destination-label">Nome do grupo ou contato</Label>
          <Input
            id="whatsapp-destination-label"
            value={formValues.label}
            onChange={(event) => handleFieldChange("label", event.target.value)}
            placeholder={
              formValues.type === "GROUP"
                ? "Grupo de avisos da sede"
                : "Responsavel da secretaria"
            }
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp-destination-church">Igreja</Label>
          <Select
            id="whatsapp-destination-church"
            value={formValues.churchId}
            onChange={(event) =>
              handleFieldChange("churchId", event.target.value)
            }
            disabled={isSubmitting}
          >
            <option value="">Todas as igrejas</option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </Select>
        </div>

        {formValues.type === "GROUP" ? (
          <div className="space-y-2 md:col-span-2 xl:col-span-2">
            <Label htmlFor="whatsapp-destination-group-id">Codigo do grupo</Label>
            <Input
              id="whatsapp-destination-group-id"
              value={formValues.groupId}
              onChange={(event) =>
                handleFieldChange("groupId", event.target.value)
              }
              placeholder="1203XXXXXXXX@g.us"
              disabled={isSubmitting}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Use o codigo do grupo que deve receber os avisos.
            </p>
          </div>
        ) : (
          <div className="space-y-2 md:col-span-2 xl:col-span-2">
            <Label htmlFor="whatsapp-destination-phone">Numero do contato</Label>
            <Input
              id="whatsapp-destination-phone"
              value={formValues.phoneNumber}
              onChange={(event) =>
                handleFieldChange("phoneNumber", event.target.value)
              }
              placeholder="+5585987654321"
              disabled={isSubmitting}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Use esta opcao quando o aviso precisar chegar a um contato especifico.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="whatsapp-destination-status">Status</Label>
          <Select
            id="whatsapp-destination-status"
            value={formValues.enabled ? "enabled" : "disabled"}
            onChange={(event) =>
              handleFieldChange("enabled", event.target.value === "enabled")
            }
            disabled={isSubmitting}
          >
            <option value="enabled">Ativo</option>
            <option value="disabled">Inativo</option>
          </Select>
        </div>
      </div>

      {submitError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {destination ? "Salvar" : "Adicionar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
