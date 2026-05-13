import { User } from "lucide-react";

const UserCard = ({ name, email }: { name: string; email: string }) => {
  return (
    <div className="border border-gray-200 rounded-md p-4">
      <User className="w-6 h-6 text-blue-700" />
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-gray-500">{email}</p>
    </div>
  );
}

export default UserCard;