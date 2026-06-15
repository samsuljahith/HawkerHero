"use client";

interface AgentStep {
  label: string;
  icon: string;
}

interface AgentProgressProps {
  steps: AgentStep[];
  currentStep: number;
  isComplete?: boolean;
}

export default function AgentProgress({ steps, currentStep, isComplete }: AgentProgressProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const isDone = isComplete || i < currentStep;
        const isActive = !isComplete && i === currentStep;
        return (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-[10px] transition-all duration-300 ${
              isActive ? "bg-orange-50 border border-orange-200" : isDone ? "bg-emerald-50/50" : "opacity-40"
            }`}
          >
            <span className="text-base">{step.icon}</span>
            <span className={`text-sm font-medium ${isActive ? "text-[#F2541B]" : isDone ? "text-[#0FA968]" : "text-[#6B6B6B]"}`}>
              {step.label}
            </span>
            <span className="ml-auto">
              {isDone && <span className="text-[#0FA968] text-xs">✓</span>}
              {isActive && <span className="w-3 h-3 rounded-full bg-[#F2541B] animate-pulse inline-block" />}
            </span>
          </div>
        );
      })}
    </div>
  );
}
