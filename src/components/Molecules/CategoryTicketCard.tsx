import { MoveRight } from "lucide-react";

interface CategoryTicketCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const CategoryTicketCard = ({
  title,
  description,
  icon,
  onClick,
}: CategoryTicketCardProps) => {
  return (
    <div
      key={title}
      className="group border bg-gray-50 border-gray-200 rounded-md p-9 text-left hover:border-blue-500 hover:bg-gray-50 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="mb-4 w-fit bg-blue-100 p-3 rounded-sm">{icon}</div>
      <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-800 transition">
        {title}
      </h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <span className="flex gap-2 text-blue-600 text-sm  items-center">
        Seleccionar categoría
        <span className="group-hover:translate-x-1 transition">
          <MoveRight size={16} />
        </span>
      </span>
    </div>
  );
};

export default CategoryTicketCard;
