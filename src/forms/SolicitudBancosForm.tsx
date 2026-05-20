import type { CategoryFormProps } from "./types";

export type SolicitudBancosPayload = {
  subcategoria: string;
};

export const defaultValue: SolicitudBancosPayload = {
  subcategoria: "",
};

const SUBCATEGORIAS = [
  "Bancos",
  "Documentos Para Firma",
  "Envio Valija Santiago",
  "Envío Pedidos",
  "Retiro Cheques & Facturas",
  "Envio Cedi",
  "Otros",
];

const inputBase =
  "w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-default";

export default function SolicitudBancosForm({
  value,
  onChange,
  readOnly = false,
}: CategoryFormProps<SolicitudBancosPayload>) {
  return (
    <div className="flex flex-col gap-4 border border-gray-200 p-6 text-gray-700 rounded-xl bg-white">
      <h2 className="text-sm font-semibold text-gray-700">Detalles de Mensajería</h2>
      <div>
        <label className="text-xs text-gray-400 block mb-1">Categoría</label>
        {readOnly ? (
          <div className={inputBase + " bg-gray-50 text-gray-700"}>
            {value.subcategoria || "—"}
          </div>
        ) : (
          <select
            value={value.subcategoria}
            onChange={(e) => onChange({ ...value, subcategoria: e.target.value })}
            className={inputBase}
          >
            <option value="">Seleccione una subcategoría</option>
            {SUBCATEGORIAS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
