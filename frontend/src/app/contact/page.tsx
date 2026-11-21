"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/select";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <Navbar />

      <div className="bg-soft-gradient border-b border-line py-12 sm:py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Customer & Enterprise Support
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-plum tracking-tight">
            Get In Touch With DigiVio
          </h1>
          <p className="text-sm text-ink-muted max-w-xl mx-auto leading-relaxed">
            Need custom marathon race bib quotes, custom CNC laser cut foam specs, or prepress guidance? Our engineering team is here to assist.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Info Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-card bg-surface-card border border-line shadow-soft space-y-4">
              <h3 className="font-heading font-bold text-base text-plum">Factory Office</h3>
              <div className="space-y-3 text-xs text-ink-muted">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-btn bg-lavender flex items-center justify-center text-primary">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>press@digivio.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-btn bg-lavender flex items-center justify-center text-primary">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>+91 22 2847 9000</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-btn bg-lavender flex items-center justify-center text-primary">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>Digital Heroes Industrial Park, Andheri East, Mumbai 400093</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-card bg-lavender-light border border-line text-xs text-ink-muted space-y-1">
              <strong className="text-plum">Production Floor Hours:</strong>
              <p>Monday – Saturday: 8:00 AM – 8:00 PM IST</p>
              <p>Automated cloud proofing operates 24/7/365.</p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 bg-surface-card rounded-card border border-line shadow-card p-6 sm:p-8 space-y-6">
            {submitted ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                <h3 className="font-heading font-extrabold text-xl text-plum">
                  Message Dispatched
                </h3>
                <p className="text-xs text-ink-muted">
                  Thank you! Our print production team will respond to your inquiry within 2 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-heading font-bold text-lg text-plum pb-2 border-b border-line">
                  Send a Message
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Your Name" placeholder="e.g. Priya Patel" required />
                  <Input label="Work Email" type="email" placeholder="name@company.com" required />
                </div>

                <Input label="Subject / Project Reference" placeholder="e.g. 5,000 Marathon Bib Quote" required />

                <Textarea label="Message & Requirements" placeholder="Please describe required quantities, dimensions, and turnaround deadlines..." required />

                <div className="pt-2">
                  <Button variant="primary" size="lg" type="submit" className="w-full sm:w-auto">
                    Send Inquiry
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
