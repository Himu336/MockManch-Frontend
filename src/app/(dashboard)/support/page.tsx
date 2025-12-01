"use client";

import React, { useState } from "react";
import Card from "../../../components/ui/Card";
import PageHeader from "../../../components/ui/PageHeader";
import {
  Mail,
  Scale,
  Shield,
  FileText,
  HelpCircle,
  AlertCircle,
  Copy,
  CheckCircle2,
} from "lucide-react";

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<"contact" | "legal">("contact");
  const [emailCopied, setEmailCopied] = useState(false);
  const supportEmail = "syntaxcomet@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const tabs = [
    { id: "contact" as const, label: "Contact", icon: Mail },
    { id: "legal" as const, label: "Legal", icon: Scale },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support & Contact"
        subtitle="Get help, share feedback, or learn about our policies"
      />

      {/* Contact Information Banner */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Mail className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Contact Us</h3>
              <p className="text-white/70 text-sm">
                Email us at{" "}
                <a
                  href="mailto:syntaxcomet@gmail.com"
                  className="text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  syntaxcomet@gmail.com
                </a>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs mb-1">Response Time</p>
            <p className="text-white font-medium">24-48 hours</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card className="p-0">
        <div className="border-b border-white/10">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`
                    flex items-center gap-2 px-6 py-4 border-b-2 transition-colors
                    ${
                      isActive
                        ? "border-primary-ui text-white"
                        : "border-transparent text-white/60 hover:text-white/80"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Contact Us</h3>
                <p className="text-white/60 text-sm">
                  For support, feedback, bug reports, or any inquiries, please email us directly
                </p>
              </div>

              <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="p-4 bg-blue-500/20 rounded-full">
                    <Mail className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white/70 text-sm mb-3">Send us an email at:</p>
                    <div className="flex items-center gap-3 justify-center">
                      <a
                        href={`mailto:${supportEmail}`}
                        className="text-2xl font-semibold text-blue-400 hover:text-blue-300 underline transition-colors"
                      >
                        {supportEmail}
                      </a>
                      <button
                        onClick={handleCopyEmail}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
                        title="Copy email address"
                      >
                        {emailCopied ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5 text-white/60 group-hover:text-white" />
                        )}
                      </button>
                    </div>
                    {emailCopied && (
                      <p className="text-green-400 text-sm mt-2">Email copied to clipboard!</p>
                    )}
                  </div>
                </div>
              </Card>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-400 font-semibold text-sm mb-1">
                      Need Help?
                    </h4>
                    <p className="text-white/70 text-sm">
                      Whether you have questions, feedback, bug reports, or feature requests, 
                      please email us at the address above. We typically respond within 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legal Tab */}
          {activeTab === "legal" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Legal Information</h3>
                <p className="text-white/60 text-sm">
                  Important legal documents and policies for MockManch
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Terms of Service */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Scale className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white font-semibold">Terms of Service</h4>
                  </div>
                  <p className="text-white/70 text-sm mb-4">
                    Read our terms and conditions for using MockManch services.
                  </p>
                  <div className="space-y-2 text-xs text-white/60">
                    <p>• Acceptance of Terms</p>
                    <p>• Use License</p>
                    <p>• User Accounts</p>
                    <p>• Payment and Refunds</p>
                    <p>• Limitation of Liability</p>
                  </div>
                </Card>

                {/* Privacy Policy */}
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <h4 className="text-white font-semibold">Privacy Policy</h4>
                  </div>
                  <p className="text-white/70 text-sm mb-4">
                    Learn how we collect, use, and protect your personal information.
                  </p>
                  <div className="space-y-2 text-xs text-white/60">
                    <p>• Information We Collect</p>
                    <p>• How We Use Your Information</p>
                    <p>• Information Sharing</p>
                    <p>• Data Security</p>
                    <p>• Your Rights</p>
                  </div>
                </Card>

                {/* Licensing */}
                <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-white font-semibold">Licensing</h4>
                  </div>
                  <p className="text-white/70 text-sm mb-4">
                    Software licenses and intellectual property information.
                  </p>
                  <div className="space-y-2 text-xs text-white/60">
                    <p>• Software License</p>
                    <p>• License Grant</p>
                    <p>• Restrictions</p>
                    <p>• Intellectual Property</p>
                    <p>• Third-Party Licenses</p>
                  </div>
                </Card>

                {/* Data Sharing */}
                <Card className="bg-gradient-to-br from-pink-500/10 to-red-500/10 border-pink-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-pink-400" />
                    <h4 className="text-white font-semibold">Data Sharing</h4>
                  </div>
                  <p className="text-white/70 text-sm mb-4">
                    How we handle and share your data with third parties.
                  </p>
                  <div className="space-y-2 text-xs text-white/60">
                    <p>• Data We Collect</p>
                    <p>• How We Share Data</p>
                    <p>• Data Security</p>
                    <p>• Data Retention</p>
                    <p>• Your Control</p>
                  </div>
                </Card>
              </div>

              {/* Contact for Legal Questions */}
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-400 font-semibold text-sm mb-1">
                      Legal Questions?
                    </h4>
                    <p className="text-white/70 text-sm">
                      For questions about our legal policies, please contact us at{" "}
                      <a
                        href="mailto:syntaxcomet@gmail.com"
                        className="text-yellow-400 hover:text-yellow-300 underline"
                      >
                        syntaxcomet@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

