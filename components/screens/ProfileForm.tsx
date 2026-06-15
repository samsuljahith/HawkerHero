"use client";

import { useState, useRef } from "react";
import { BusinessProfile } from "@/lib/profiles";
import { parseUploadedFile } from "@/lib/fileParser";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface ProfileFormProps {
  onSave: (profile: BusinessProfile) => void;
  onCancel?: () => void;
  isOnboarding?: boolean;
}

const TYPES = [
  "Restaurant", "Cafe", "Barber Shop", "Salon", "Retail Store",
  "Solar Company", "Cleaning Service", "Fitness Studio", "Tuition Centre", "Florist", "Other",
];

export default function ProfileForm({ onSave, onCancel, isOnboarding }: ProfileFormProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", type: "Restaurant", description: "", offerings: "",
    location: "", contact: "", color1: "#F2541B", color2: "#1A1410",
    uploadedData: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: string, val: string) => setForm({ ...form, [key]: val });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const parsed = await parseUploadedFile(file);
      setForm((f) => ({ ...f, uploadedData: parsed, offerings: f.offerings || parsed.slice(0, 2000) }));
      setUploadFileName(file.name);
    } catch (err: any) {
      alert(err.message || "Could not read file.");
    } finally { setUploading(false); }
  };

  const handleSave = () => {
    if (!form.name.trim()) { alert("Please enter your business name."); return; }
    const profile: BusinessProfile = {
      id: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || `biz-${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      description: form.description,
      offerings: form.offerings,
      location: form.location,
      contact: form.contact,
      brandColors: [form.color1, form.color2].filter(Boolean),
      uploadedData: form.uploadedData,
      createdAt: Date.now(),
    };
    onSave(profile);
  };

  const inputCls = "w-full bg-[#FAF8F5] border border-[#ECE6DF] rounded-[10px] px-4 py-3 text-sm outline-none focus:border-[#F2541B] transition-colors placeholder:text-[#6B6B6B]/50";

  return (
    <div className="max-w-lg mx-auto animate-fadeIn">
      {isOnboarding && (
        <div className="text-center mb-8">
          <span className="text-4xl">🦸</span>
          <h1 className="text-2xl font-bold text-[#1A1410] mt-3">Welcome to HawkerHero</h1>
          <p className="text-[#6B6B6B] text-sm mt-2">
            Tell us about your business. Our AI will handle the rest — audience, branding, strategy, everything.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? "bg-[#F2541B]" : "bg-[#ECE6DF]"}`} />
        ))}
        <span className="text-xs text-[#6B6B6B] ml-2">Step {step}/2</span>
      </div>

      <Card>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#1A1410] mb-1">About your business</h2>
              <p className="text-xs text-[#6B6B6B]">Just the basics — our AI will figure out your audience and branding strategy automatically.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Business Name *</label>
              <input className={inputCls} placeholder="e.g. Sara's Biryani House" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Business Type</label>
              <select className={inputCls} value={form.type} onChange={e => set("type", e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Description</label>
              <textarea className={`${inputCls} resize-none`} rows={3} placeholder="What makes your business unique?" value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Location</label>
              <input className={inputCls} placeholder="e.g. 42 Serangoon Road, Singapore" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Contact</label>
              <input className={inputCls} placeholder="Phone, email, or social media" value={form.contact} onChange={e => set("contact", e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 2: Products & Services */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#1A1410] mb-1">Your products & services</h2>
              <p className="text-xs text-[#6B6B6B]">Upload a file or type your menu/catalog. This helps our AI recommend what to promote.</p>
            </div>
            <div className="p-4 rounded-[10px] border-2 border-dashed border-[#ECE6DF] hover:border-[#F2541B] transition-colors text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              {uploading ? (
                <p className="text-sm text-[#6B6B6B]">Reading file…</p>
              ) : uploadFileName ? (
                <div>
                  <p className="text-sm font-medium text-[#0FA968]">✓ {uploadFileName} uploaded</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">Click to replace</p>
                </div>
              ) : (
                <div>
                  <span className="text-2xl block mb-1">📄</span>
                  <p className="text-sm font-medium text-[#1A1410]">Upload CSV or Excel file</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">Menu, product list, service catalog, pricing</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#ECE6DF]" />
              <span className="text-xs text-[#6B6B6B]">or type manually</span>
              <div className="flex-1 h-px bg-[#ECE6DF]" />
            </div>
            <div>
              <textarea className={`${inputCls} resize-none`} rows={8}
                placeholder={"Chicken Biryani — $6.50\nMutton Biryani — $8.00\nChicken 65 — $5.00\nParotta — $2.00"}
                value={form.offerings} onChange={e => set("offerings", e.target.value)} />
              <p className="text-xs text-[#6B6B6B] mt-1">One item per line with price.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#ECE6DF]">
          <div>
            {step > 1 && <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>}
            {!isOnboarding && onCancel && step === 1 && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
          </div>
          <div>
            {step === 1 ? (
              <Button onClick={() => { if (!form.name.trim()) { alert("Please enter your business name."); return; } setStep(2); }}>Next →</Button>
            ) : (
              <Button onClick={handleSave}>{isOnboarding ? "🚀 Get Started" : "Save Profile"}</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
