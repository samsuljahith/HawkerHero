interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="text-lg font-semibold text-[#1A1410] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#6B6B6B] max-w-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-semibold text-[#F2541B] hover:bg-orange-50 rounded-[10px] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
