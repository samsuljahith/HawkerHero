interface StatProps {
  label: string;
  value: string;
  icon?: string;
  trend?: "up" | "down" | "neutral";
}

export default function Stat({ label, value, icon, trend }: StatProps) {
  const trendColor = trend === "up" ? "text-[#0FA968]" : trend === "down" ? "text-red-500" : "text-[#6B6B6B]";
  return (
    <div className="bg-white rounded-[14px] border border-[#ECE6DF] p-4 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-xl font-bold ${trendColor !== "text-[#6B6B6B]" ? trendColor : "text-[#1A1410]"}`}>
        {value}
      </p>
    </div>
  );
}
