import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { SolicitudMantenimientoPayload } from "../forms/SolicitudMantenimientoForm";
import type { Ticket } from "../types/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE      = "0047AC";
const DARK_BLUE = "003080";
const WHITE     = "FFFFFF";
const DARK      = "1F2937";
const GRAY      = "6B7280";
const LIGHT     = "F3F4F6";
const BLUE_SOFT = "EFF6FF";
const BORDER    = "D1D5DB";

// A4 portrait, 1-inch margins: 11906 - 2*1440 = 9026 twips
const W = 9026;

const STATUS: Record<string, string> = {
  pending:     "Pendiente",
  in_progress: "En progreso",
  completed:   "Resuelto",
  confirmed:   "Confirmado",
  canceled:    "Cancelado",
};
const PRIORITY: Record<string, string> = {
  urgent: "Urgente",
  high:   "Alta",
  medium: "Media",
  low:    "Baja",
};

// ─── Micro helpers ────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-EC", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function borders(color = BORDER) {
  const s = { style: BorderStyle.SINGLE as typeof BorderStyle.SINGLE, size: 1, color };
  return { top: s, bottom: s, left: s, right: s };
}

function run(
  text: string,
  opts: { bold?: boolean; color?: string; size?: number; italic?: boolean } = {},
): TextRun {
  return new TextRun({
    text,
    bold:    opts.bold,
    italics: opts.italic,
    color:   opts.color ?? DARK,
    size:   opts.size  ?? 18, // half-points; 18 = 9 pt
    font:   "Calibri",
  });
}

function p(
  runs: TextRun[],
  align?: (typeof AlignmentType)[keyof typeof AlignmentType],
  before = 50,
  after  = 50,
): Paragraph {
  return new Paragraph({
    alignment: align,
    spacing: { before, after },
    children: runs,
  });
}

// ─── Cell factories ───────────────────────────────────────────────────────────

function labelCell(text: string, w: number): TableCell {
  return new TableCell({
    width:          { size: w, type: WidthType.DXA },
    borders:        borders(),
    shading:        { type: ShadingType.SOLID, color: LIGHT, fill: LIGHT },
    verticalAlign:  VerticalAlign.CENTER,
    children:       [p([run(text, { bold: true, color: GRAY, size: 16 })])],
  });
}

function valueCell(text: string, w: number, span?: number): TableCell {
  return new TableCell({
    width:       { size: w, type: WidthType.DXA },
    columnSpan:  span,
    borders:     borders(),
    verticalAlign: VerticalAlign.CENTER,
    children:    [p([run(text)])],
  });
}

function blueCell(text: string, w: number, span?: number): TableCell {
  return new TableCell({
    width:        { size: w, type: WidthType.DXA },
    columnSpan:   span,
    borders:      borders(BLUE),
    shading:      { type: ShadingType.SOLID, color: BLUE, fill: BLUE },
    verticalAlign: VerticalAlign.CENTER,
    children:     [p([run(text, { bold: true, color: WHITE })], AlignmentType.CENTER)],
  });
}

function sectionCell(text: string, cols: number): TableCell {
  return new TableCell({
    columnSpan:   cols,
    borders:      borders(),
    shading:      { type: ShadingType.SOLID, color: BLUE_SOFT, fill: BLUE_SOFT },
    verticalAlign: VerticalAlign.CENTER,
    children:     [p([run(text, { bold: true, color: BLUE })], AlignmentType.CENTER)],
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function exportMantenimientoDocx(
  ticket: Ticket,
  payload: SolicitudMantenimientoPayload,
): Promise<void> {
  const EMPTY_ROW = { fecha: "", realizadoPor: "", horaInicio: "", horaTermino: "" };
  const registros = payload.registros?.length
    ? payload.registros
    : [{ ...EMPTY_ROW }, { ...EMPTY_ROW }];

  const ubicacion = payload.ubicacion === "otro"
    ? payload.otraUbicacion || "Otro"
    : payload.ubicacion;

  // Column sizes for 4-column tables
  const LW = Math.floor(W * 0.20); // label column
  const VW = Math.floor(W / 2) - LW;

  // Execution table column widths
  const EC = [
    Math.floor(W * 0.17),  // Fecha
    Math.floor(W * 0.38),  // Realizado por
    Math.floor(W * 0.225), // Hora inicio
    Math.floor(W * 0.225), // Hora término
  ];

  // ── Document sections ──────────────────────────────────────────────────────

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [

        // ── Header ──────────────────────────────────────────────────────────
        new Table({
          width: { size: W, type: WidthType.DXA },
          rows: [
            new TableRow({
              height: { value: 680, rule: HeightRule.EXACT },
              children: [
                // Logo area
                new TableCell({
                  width:        { size: Math.floor(W * 0.22), type: WidthType.DXA },
                  borders:      borders(BLUE),
                  shading:      { type: ShadingType.SOLID, color: BLUE, fill: BLUE },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    p([run("LETERAGO", { bold: true, color: WHITE, size: 28 })], AlignmentType.CENTER),
                  ],
                }),
                // Form title
                new TableCell({
                  width:        { size: Math.floor(W * 0.55), type: WidthType.DXA },
                  borders:      borders(BLUE),
                  shading:      { type: ShadingType.SOLID, color: BLUE, fill: BLUE },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    p([run("SOLICITUD DE MANTENIMIENTO", { bold: true, color: WHITE, size: 22 })], AlignmentType.CENTER),
                  ],
                }),
                // Form code
                new TableCell({
                  width:        { size: W - Math.floor(W * 0.22) - Math.floor(W * 0.55), type: WidthType.DXA },
                  borders:      borders(DARK_BLUE),
                  shading:      { type: ShadingType.SOLID, color: DARK_BLUE, fill: DARK_BLUE },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    p([run("FOR-077", { bold: true, color: WHITE, size: 20 })], AlignmentType.CENTER, 30, 0),
                    p([run("Rev. 01",  { color: "AABBDD", size: 16 })],         AlignmentType.CENTER, 0, 30),
                  ],
                }),
              ],
            }),
          ],
        }),

        gap(),

        // ── Ticket info ──────────────────────────────────────────────────────
        new Table({
          width: { size: W, type: WidthType.DXA },
          rows: [
            row4(labelCell("N° Ticket",      LW), valueCell(ticket.id,                                         VW, undefined), labelCell("Fecha",     LW), valueCell(fmtDate(ticket.createdAt),                   VW, undefined)),
            row4(labelCell("Solicitado por", LW), valueCell(ticket.createdBy ?? "—",                            VW, undefined), labelCell("Estado",    LW), valueCell(STATUS[ticket.status]   ?? ticket.status,   VW, undefined)),
            row4(labelCell("Asignado a",    LW), valueCell(ticket.assignedTo  ?? "Sin asignar",                VW, undefined), labelCell("Prioridad", LW), valueCell(PRIORITY[ticket.priority] ?? ticket.priority, VW, undefined)),
          ],
        }),

        gap(),

        // ── Equipment details ────────────────────────────────────────────────
        new Table({
          width: { size: W, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [labelCell("Área o Equipo", LW), valueCell(payload.area,        W - LW, 3)] }),
            new TableRow({ children: [labelCell("Ubicación",     LW), valueCell(ubicacion,            VW),        labelCell("Código", LW), valueCell(payload.codigo || "—", VW)] }),
            new TableRow({
              children: [
                labelCell("Descripción", LW),
                new TableCell({
                  columnSpan: 3,
                  width:      { size: W - LW, type: WidthType.DXA },
                  borders:    borders(),
                  children:   [
                    new Paragraph({
                      spacing: { before: 80, after: 80 },
                      children: [run(ticket.description || "Sin descripción.")],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        gap(),

        // ── Execution records ────────────────────────────────────────────────
        new Table({
          width:        { size: W, type: WidthType.DXA },
          columnWidths: EC,
          rows: [
            // Section title
            new TableRow({ children: [sectionCell("REGISTRO DE EJECUCIÓN", 4)] }),
            // Column headers
            new TableRow({ children: EC.map((w, i) => blueCell(["Fecha", "Realizado por", "Hora inicio", "Hora término"][i], w)) }),
            // Data rows
            ...registros.map((r) =>
              new TableRow({
                height: { value: 440, rule: HeightRule.ATLEAST },
                children: [
                  valueCell(r.fecha,        EC[0]),
                  valueCell(r.realizadoPor, EC[1]),
                  valueCell(r.horaInicio,   EC[2]),
                  valueCell(r.horaTermino,  EC[3]),
                ],
              })
            ),
          ],
        }),

        gap(),

        // ── Observations ─────────────────────────────────────────────────────
        new Table({
          width: { size: W, type: WidthType.DXA },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: borders(),
                  shading: { type: ShadingType.SOLID, color: LIGHT, fill: LIGHT },
                  children: [p([run("OBSERVACIONES", { bold: true, color: GRAY, size: 16 })])],
                }),
              ],
            }),
            new TableRow({
              height: { value: 1200, rule: HeightRule.ATLEAST },
              children: [
                new TableCell({
                  borders:  borders(),
                  children: [
                    new Paragraph({
                      spacing: { before: 80, after: 80 },
                      children: [run(payload.observaciones || "")],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        gap(),

        // ── Signatures ────────────────────────────────────────────────────────
        new Table({
          width: { size: W, type: WidthType.DXA },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width:   { size: Math.floor(W / 2), type: WidthType.DXA },
                  borders: borders(),
                  shading: { type: ShadingType.SOLID, color: LIGHT, fill: LIGHT },
                  children: [p([run("FIRMA SOLICITANTE", { bold: true, color: GRAY, size: 16 })], AlignmentType.CENTER)],
                }),
                new TableCell({
                  width:   { size: W - Math.floor(W / 2), type: WidthType.DXA },
                  borders: borders(),
                  shading: { type: ShadingType.SOLID, color: LIGHT, fill: LIGHT },
                  children: [p([run("FIRMA EJECUTOR", { bold: true, color: GRAY, size: 16 })], AlignmentType.CENTER)],
                }),
              ],
            }),
            new TableRow({
              height: { value: 1440, rule: HeightRule.ATLEAST },
              children: [
                sigCell(`Nombre: ${ticket.createdBy  ?? ""}`, Math.floor(W / 2)),
                sigCell(`Nombre: ${ticket.assignedTo ?? ""}`, W - Math.floor(W / 2)),
              ],
            }),
          ],
        }),

      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${ticket.id}_mantenimiento.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Private layout helpers ───────────────────────────────────────────────────

function gap(): Paragraph {
  return new Paragraph({ spacing: { before: 120, after: 0 }, children: [] });
}

function row4(...cells: [TableCell, TableCell, TableCell, TableCell]): TableRow {
  return new TableRow({ children: cells });
}

function sigCell(nameText: string, w: number): TableCell {
  return new TableCell({
    width:   { size: w, type: WidthType.DXA },
    borders: borders(),
    children: [
      new Paragraph({ spacing: { before: 1200, after: 60 }, children: [run(nameText, { size: 16, color: GRAY })] }),
    ],
  });
}
