"use client";

import { useState } from "react";
import { BusinessProfile } from "@/lib/profiles";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface ProfileFormProps {
  onSave: (profile: BusinessProfile) => void;
  onCancel: () => void;
}

const TYPES = ["Restaurant", "Barber Shop", "Salon", "Retail", "Cafe", "Other"];

export default function ProfileForm({ onSave, onCancel }: ProfileFormProps) {
  const [form, setForm] = useState({
    name: "",
    type: "Restaurant",
    description: "",
    offerings: "",
    location: "",
    contact: "",
    color1: "#F2541B",
    color2: "#1A1410",
    color3: "#FAF8F5",
  });

  const set = (key: string, val: string) => setForm({ ...form, [key]: val });

  const handleSave = () => {
    const profile: BusinessProfile = {
      id: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || `biz-${Date.now()}`,
      name: form.name || "My Business",
      type: form.type,
      description: form.description,
      offerings: form.offerings,
      location: form.location,
      contact: form.contact,
      brandColors: [form.color1, form.color2, form.color3].filter(Boolean),
    };
    onSave(profile);
  };

  const inputCls = "w-full bg-[#FAF8F5] border border-[#ECE6DF] rounded-[10px] px-4 py-2.5 text-sm outline-none focus:border-[#F2541B] transition-colors placeholder:text-[#6B6B6B]/50";

  return (
    <div className="max-w-lg mx-auto animate-fadeIn">
      <Card>
        <h2 className="text-xl font-bold text-[#1A1410] mb-6">New Business Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Business Name</label>
            <input className={inputCls} placeholder="e.g. Sara's Biryani" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Type</label>
            <select className={inputCls} value={form.type} onChange={e => set("type", e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Description</label>
            <input className={inputCls} placeholder="What makes your business special?" value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Products / Services</label>
            <textarea className={`${inputCls} resize-none`} rows={5} placeholder={"Chicken Biryani $6.50\nMutton Biryani $8\nVeg Biryani $5"} value={form.offerings} onChange={e => set("offerings", e.target.value)} />
            <p className="text-xs text-[#6B6B6B] mt-1">One item per line, with price</p>
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Location</label>
            <input className={inputCls} placeholder="42 Serangoon Road, Singapore" value={form.location} onChange={e => set("location", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Contact</label>
            <input className={inputCls} placeholder="@handle or phone" value={form.contact} onChange={e => set("contact", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-1.5 block">Brand Colors</label>
            <div className="flex gap-3">
              <input type="color" value={form.color1} onChange={e => set("color1", e.target.value)} className="w-10 h-10 rounded-lg border border-[#ECE6DF] cursor-pointer" />
              <input type="color" value={form.color2} onChange={e => set("color2", e.target.value)} className="w-10 h-10 rounded-lg border border-[#ECE6DF] cursor-pointer" />
              <input type="color" value={form.color3} onChange={e => set("color3", e.target.value)} className="w-10 h-10 rounded-lg border border-[#ECE6DF] cursor-pointer" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSave}>Save Profile</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}
