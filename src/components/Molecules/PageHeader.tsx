interface PageHeaderProps {
  indicator?: string;
  title: string;
  description: string;
}

const PageHeader = ({ indicator, title, description }: PageHeaderProps) => {
  return (
    <div className="mb-6">
      {indicator && (
        <span className="text-xs text-[#0047AC] font-bold uppercase tracking-widest">
          {indicator}
        </span>
      )}
      <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{title}</h1>
      <p className="text-gray-400 text-sm mt-1 leading-relaxed">{description}</p>
    </div>
  );
};

export default PageHeader;
