import type { ComponentType } from "react";
import type { CategoryId } from "../types/types";
import type { CategoryFormProps } from "./types";

import SolicitudReunionForm, {
  defaultValue as reunionDefault,
} from "./SolicitudReunionForm";
import SolicitudCompraForm, {
  defaultValue as compraDefault,
} from "./SolicitudCompraForm";
import SolicitudBancosForm, {
  defaultValue as bancosDefault,
} from "./SolicitudBancosForm";

// To register a category-specific form:
//   1. Create ./<CategoryName>Form.tsx exporting the component (default) and `defaultValue`.
//   2. Add a line in FORM_REGISTRY below.
// Page picks it up automatically.

export type RegistryEntry = {
  Component: ComponentType<CategoryFormProps<unknown>>;
  defaultValue: unknown;
  required: boolean;
};

export const FORM_REGISTRY: Partial<Record<CategoryId, RegistryEntry>> = {
  "solicitud-reunion": {
    Component: SolicitudReunionForm as ComponentType<CategoryFormProps<unknown>>,
    defaultValue: reunionDefault,
    required: true,
  },
  "solicitud-compra": {
    Component: SolicitudCompraForm as ComponentType<CategoryFormProps<unknown>>,
    defaultValue: compraDefault,
    required: false,
  },
  "solicitud-bancos": {
    Component: SolicitudBancosForm as ComponentType<CategoryFormProps<unknown>>,
    defaultValue: bancosDefault,
    required: false,
  },
};

export function getCategoryForm(categoryId: CategoryId): RegistryEntry | undefined {
  return FORM_REGISTRY[categoryId];
}
