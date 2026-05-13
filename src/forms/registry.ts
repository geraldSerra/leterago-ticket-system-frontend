import type { ComponentType } from "react";
import type { CategoryId } from "../types/types";
import type { CategoryFormProps } from "./types";

import SolicitudReunionForm, {
  defaultValue as reunionDefault,
} from "./SolicitudReunionForm";

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
};

export function getCategoryForm(categoryId: CategoryId): RegistryEntry | undefined {
  return FORM_REGISTRY[categoryId];
}
