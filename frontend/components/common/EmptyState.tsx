export default function EmptyState({ title = 'Nothing here yet', subtitle = '', className = '' }: { title?: string; subtitle?: string; className?: string }) {
  return (
    <div className={`text-center text-gray-500 ${className}`}>
      <p className="text-sm font-medium">{title}</p>
      {subtitle ? <p className="text-xs text-gray-400 mt-1">{subtitle}</p> : null}
    </div>
  );
}
