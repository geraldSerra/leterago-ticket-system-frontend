export const Chart = () => { return (   <div className="lg:col-span-2 bg-[#0F1A2E] border border-blue-900/40 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-semibold">
                  Volumen de Tickets por Día
                </h3>
                <p className="text-xs text-gray-400">
                  Comparativa mensual de carga de trabajo
                </p>
              </div>

              <div className="text-xs text-gray-400 flex gap-3">
                <span className="text-blue-400">● Mes Actual</span>
                <span>● Mes Anterior</span>
              </div>
            </div>

            {/* Placeholder chart */}
            <div className="h-56 flex items-center justify-center text-gray-500 text-sm border border-dashed border-blue-900/40 rounded-md">
              Aquí va tu gráfico (Recharts / Chart.js)
            </div>
          </div>)}