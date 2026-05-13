import { Zap } from "lucide-react";

const SpeedCard = () => {
  return (
    <div className="flex flex-col gap-3 bg-gradient-to-br from-blue-600 to-blue-800 rounded-sm px-5 py-7">
      <p className=" text-blue-200 font-semibold">VELOCIDAD DE RESOLUCIÓN</p>
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-3">
          <h2 className="text-white text-5xl font-semibold">
            1.4 <span className="text-sm text-blue-200">horas</span>
          </h2>
          <p className="w-fit text-xs bg-blue-200/30 text-white px-2 py-1 rounded-sm">
            -15% vs mes anterior
          </p>
        </div>
        <Zap className="text-blue-200/30" size={80} />
      </div>
    </div>
  );
};

export default SpeedCard;
