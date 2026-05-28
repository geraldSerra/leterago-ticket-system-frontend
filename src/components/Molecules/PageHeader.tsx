interface PageHeaderProps {
  title: string;
  description: string;
}

const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-400 text-sm mt-1 leading-relaxed">{description}</p>
    </div>
  );
};

export default PageHeader;
