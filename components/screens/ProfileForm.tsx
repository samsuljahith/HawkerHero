"use client";

import { useState, useRef } from "react";
import { BusinessProfile } from "@/lib/profiles";
import { parseUploadedFile } from "@/lib/fileParser";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface ProfileFormProps {
  onSave: (profile: BusinessProfile) => void;
  onCancel?: () => void;
  isOnboarding?: boolean; // true = first time, hide cancel
}

const TYPES = [
  "Restaurant",
  "Cafe",
  "Barber Shop",
  "Salon",
  "Retail Store",
  "Solar Company",
  "Cleaning Service",
  "Fitness Studio",
  "Tuition Centre",
  "Florist",
  "Other",
];

export default function ProfileForm({ onSave, onCancel, isOnboarding }: ProfileFormProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    type: "Restaurant",
    description: "",
    offerings: "",
    targetAudience: "",
    branding: "",
    location: "",
    contact: "",
    color1: "#F2541B",
    color2: "#1A1410",
    color3: "#FAF8F5",
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
      set("uploadedData", parsed);
      setUploadFileName(file.name);
      // Also auto-populate offerings if empty
      if (!form.offerings && parsed.length > 20) {
        set("offerings", parsed.slice(0, 2000));
      }
    } catch (err: any) {
      alert(err.message || "Could not read file. Try a simpler CSV format.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) { alert("Please enter your business name."); return; }
    const profile: BusinessProfile = {
      id: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || `biz-${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      description: form.description,
      offerings: form.offerings,
      targetAudience: form.targetAudience,
      branding: form.branding,
      location: form.location,
      contact: form.contact,
      brandColors: [form.color1, form.color2, form.color3].filter(Boolean),
      uploadedData: form.uploadedData,
      createdAt: Date.now(),
    };
    onSave(profile);
  };

  const inputCls = "w-full bg-[#FAF8F5] border border-[#ECE6DF] rounded-[10px] px-4 py-3 text-sm outline-none focus:border-[#F2541B] transition-colors placeholder:text-[#6B6B6B]/50";
  const totalSteps = 3;

  return (
    <div className="max-w-lg mx-auto animate-fadeIn">
      {isOnboarding && (
        <div className="text-center mb-8">
          <span className="text-4xl">🦸</span>
          <h1 className="text-2xl font-bold text-[#1A1410] mt-3">Welcome to HawkerHero</h1>
          <p className="text-[#6B6B6B] text-sm mt-2">
            Let&apos;s set up your business profile. This takes about 2 minutes and helps our AI understand your business perfectly.
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? "bg-[#F2541B]" : "bg-[#ECE6DF]"}`} />
        ))}
        <span className="text-xs text-[#6B6B6B] ml-2">Step {step}/{totalSteps}</span>
      </div>

      <Card>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#1A1410] mb-1">Tell us about your business</h2>
              <p className="text-xs text-[#6B6B6B]">Start with the basics — your business name and what you do.</p>
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
              <textarea className={`${inputCls} resize-none`} rows={3} placeholder="What makes your business unique? What's your story?" value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Location</label>
              <input className={inputCls} placeholder="e.g. 42 Serangoon Road, Singapore" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Contact</label>
              <input className={inputCls} placeholder="Phone, email, or social media handle" value={form.contact} onChange={e => set("contact", e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 2: Products & Services */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#1A1410] mb-1">Your products & services</h2>
              <p className="text-xs text-[#6B6B6B]">List what you offer, or upload a file with your menu/catalog/services.</p>
            </div>

            {/* File Upload */}
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
                  <p className="text-xs text-[#6B6B6B] mt-1">Menu, product list, service catalog, pricing sheet</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#ECE6DF]" />
              <span className="text-xs text-[#6B6B6B]">or type manually</span>
              <div className="flex-1 h-px bg-[#ECE6DF]" />
            </div>

            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Products / Services / Menu</label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={8}
                placeholder={"Chicken Biryani — $6.50\nMutton Biryani — $8.00\nVeg Biryani — $5.00\nMango Lassi — $3.00\n\nOr for services:\nClassic Haircut — $18\nSkin Fade — $22\nBeard Trim — $12"}
                value={form.offerings}
                onChange={e => set("offerings", e.target.value)}
              />
              <p className="text-xs text-[#6B6B6B] mt-1">One item per line. Include prices where possible.</p>
            </div>
          </div>
        )}

        {/* Step 3: Branding & Audience */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#1A1410] mb-1">Branding & audience</h2>
              <p className="text-xs text-[#6B6B6B]">Help our AI match your brand voice and reach the right people.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Target Audience</label>
              <textarea className={`${inputCls} resize-none`} rows={2} placeholder="e.g. Families, office workers on lunch break, students, tourists visiting Little India" value={form.targetAudience} onChange={e => set("targetAudience", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Brand Personality & Tone</label>
              <textarea className={`${inputCls} resize-none`} rows={2} placeholder="e.g. Warm, family-friendly, authentic, traditional with a modern twist" value={form.branding} onChange={e => set("branding", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Brand Colors</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.color1} onChange={e => set("color1", e.target.value)} className="w-10 h-10 rounded-lg border border-[#ECE6DF] cursor-pointer" />
                <input type="color" value={form.color2} onChange={e => set("color2", e.target.value)} className="w-10 h-10 rounded-lg border border-[#ECE6DF] cursor-pointer" />
                <input type="color" value={form.color3} onChange={e => set("color3", e.target.value)} className="w-10 h-10 rounded-lg border border-[#ECE6DF] cursor-pointer" />
                <span className="text-xs text-[#6B6B6B]">Pick 2-3 colors</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#ECE6DF]">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>← Back</Button>
            )}
            {!isOnboarding && onCancel && step === 1 && (
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            )}
          </div>
          <div>
            {step < totalSteps ? (
              <Button onClick={() => {
                if (step === 1 && !form.name.trim()) { alert("Please enter your business name."); return; }
                setStep(step + 1);
              }}>
                Next →
              </Button>
            ) : (
              <Button onClick={handleSave}>
                {isOnboarding ? "🚀 Create My Profile" : "Save Profile"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
