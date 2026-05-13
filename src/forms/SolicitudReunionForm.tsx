import { Users, Clock } from "lucide-react";
import type { CategoryFormProps } from "./types";

export type SolicitudReunionPayload = {
  salon: string;
  cantidadParticipantes: number;
  tipoMontaje: "" | "auditorio" | "u" | "mesa-redonda" | "escuela";
  duracion: number;
  fecha: string;
  hora: string;
  refrigerios: string[];
  soporte: string[];
};

export const defaultValue: SolicitudReunionPayload = {
  salon: "",
  cantidadParticipantes: 0,
  tipoMontaje: "",
  duracion: 0,
  fecha: "",
  hora: "",
  refrigerios: [],
  soporte: [],
};

const cateringOptions = [
  "Cafetería Continua",
  "Estación de Agua/Fruta",
  "Almuerzo Corporativo",
  "Snacks Media Mañana",
];

const supportOptions = [
  "Fotografias",
  "Cotizaciones",
  "Documentos de soporte",
  "Otros",
];

export default function SolicitudReunionForm({
  value,
  onChange,
  readOnly = false,
}: CategoryFormProps<SolicitudReunionPayload>) {
  const set = <K extends keyof SolicitudReunionPayload>(
    key: K,
    v: SolicitudReunionPayload[K],
  ) => {
    if (readOnly) return;
    onChange({ ...value, [key]: v });
  };

  const toggleArr = (key: "refrigerios" | "soporte", v: string) => {
    if (readOnly) return;
    const arr = value[key];
    set(key, arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const inputBase =
    "w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-default";

  return (
    <div className="flex flex-col gap-4 border border-gray-200 p-6 text-gray-700 rounded-xl bg-white shadow-sm">
      <div className="flex flex-col w-full">
        <h2 className="text-sm font-semibold mb-6">Detalles de la Reunión</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Salón</label>
            <select
              disabled={readOnly}
              value={value.salon}
              onChange={(e) => set("salon", e.target.value)}
              className={inputBase}
            >
              <option value="">Seleccione Salón</option>
              <option value="Sala A">Sala A</option>
              <option value="Sala B">Sala B</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Cantidad de Participantes</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                placeholder="0"
                disabled={readOnly}
                value={value.cantidadParticipantes || ""}
                onChange={(e) => set("cantidadParticipantes", Number(e.target.value) || 0)}
                className={`${inputBase} pr-10`}
              />
              <Users className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Tipo de Montaje</label>
            <select
              disabled={readOnly}
              value={value.tipoMontaje}
              onChange={(e) =>
                set("tipoMontaje", e.target.value as SolicitudReunionPayload["tipoMontaje"])
              }
              className={inputBase}
            >
              <option value="">Seleccione Estilo</option>
              <option value="auditorio">Auditorio</option>
              <option value="u">U</option>
              <option value="mesa-redonda">Mesa Redonda</option>
              <option value="escuela">Escuela</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Duración (Horas)</label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min={0}
                placeholder="0.0"
                disabled={readOnly}
                value={value.duracion || ""}
                onChange={(e) => set("duracion", Number(e.target.value) || 0)}
                className={`${inputBase} pr-10`}
              />
              <Clock className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Fecha</label>
            <input
              type="date"
              disabled={readOnly}
              value={value.fecha}
              onChange={(e) => set("fecha", e.target.value)}
              className={inputBase}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Hora</label>
            <input
              type="time"
              disabled={readOnly}
              value={value.hora}
              onChange={(e) => set("hora", e.target.value)}
              className={inputBase}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Toggles
          title="Refrigerios"
          options={cateringOptions}
          selected={value.refrigerios}
          onToggle={(v) => toggleArr("refrigerios", v)}
          readOnly={readOnly}
        />
        <Toggles
          title="Evidencia / Soporte adjunto"
          options={supportOptions}
          selected={value.soporte}
          onToggle={(v) => toggleArr("soporte", v)}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

function Toggles({
  title,
  options,
  selected,
  onToggle,
  readOnly,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  readOnly: boolean;
}) {
  return (
    <div className="flex flex-col w-full lg:flex-1">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              type="button"
              key={opt}
              disabled={readOnly}
              onClick={() => onToggle(opt)}
              className={`flex w-full items-center gap-2 px-3 py-3 rounded-md border text-sm transition ${
                readOnly ? "cursor-default" : "cursor-pointer"
              } ${
                active
                  ? "bg-blue-500/20 border-blue-500 text-blue-400"
                  : "border-gray-200 text-gray-600" +
                    (readOnly ? "" : " hover:border-blue-500")
              } ${readOnly && !active ? "opacity-60" : ""}`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  active ? "bg-blue-500 border-blue-500" : "border-gray-400"
                }`}
              >
                {active && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
