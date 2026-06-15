"use client";

import Button from "@/components/ui/Button";

interface LoginProps {
  onContinue: () => void;
}

export default function Login({ onContinue }: LoginProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="HawkerHero" className="w-20 h-20 rounded-2xl mx-auto shadow-md" />
          <h1 className="text-3xl font-bold text-[#1A1410] mt-4 tracking-tight">HawkerHero</h1>
          <p className="text-[#6B6B6B] text-sm mt-2">AI Marketing Intelligence Platform</p>
        </div>

        <div className="bg-white rounded-[14px] border border-[#ECE6DF] shadow-[0_8px_24px_rgba(0,0,0,.04)] p-8">
          <h2 className="text-lg font-semibold text-[#1A1410] mb-1">Welcome</h2>
          <p className="text-sm text-[#6B6B6B] mb-6">Sign in to manage your business marketing</p>

          <Button onClick={onContinue} size="lg" className="w-full">
            Continue (Demo)
          </Button>

          <p className="text-xs text-[#6B6B6B] mt-4">
            Built for Agnes AI Hackathon @ SMU
          </p>
        </div>
      </div>
    </div>
  );
}
