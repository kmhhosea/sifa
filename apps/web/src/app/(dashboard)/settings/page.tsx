"use client";

import React, { useState } from "react";
import { Settings, Building2, User, Palette, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/components/layout/theme-provider";
import { getInitials } from "@/lib/utils";

export default function SettingsPage() {
  const { user, currentBusiness, businesses, setCurrentBusiness } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <Header title="Settings" description="Manage your account and business settings" />
      <div className="p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-1" /> Profile
            </TabsTrigger>
            <TabsTrigger value="business">
              <Building2 className="w-4 h-4 mr-1" /> Business
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="w-4 h-4 mr-1" /> Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                    {user ? getInitials(user.name) : "?"}
                  </div>
                  <div>
                    <p className="font-medium text-lg">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <Input defaultValue={user?.name} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input defaultValue={user?.email} type="email" />
                  </div>
                </div>
                <div className="pt-2">
                  <Button onClick={handleSave}>
                    {saved ? <Check className="w-4 h-4 mr-1" /> : null}
                    {saved ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Business</CardTitle>
                  <CardDescription>Manage your business settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Business Name</label>
                      <Input defaultValue={currentBusiness?.name} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Currency</label>
                      <Select defaultValue={currentBusiness?.currency || "USD"}>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="KES">KES - Kenyan Shilling</option>
                        <option value="TZS">TZS - Tanzanian Shilling</option>
                        <option value="UGX">UGX - Ugandan Shilling</option>
                        <option value="NGN">NGN - Nigerian Naira</option>
                        <option value="ZAR">ZAR - South African Rand</option>
                      </Select>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button onClick={handleSave}>
                      {saved ? <Check className="w-4 h-4 mr-1" /> : null}
                      {saved ? "Saved!" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {businesses.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Switch Business</CardTitle>
                    <CardDescription>You have access to multiple businesses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {businesses.map((biz) => (
                        <button
                          key={biz.id}
                          onClick={() => setCurrentBusiness(biz)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            currentBusiness?.id === biz.id
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                              <p className="font-medium">{biz.name}</p>
                              <p className="text-xs text-gray-500">{biz.currency}</p>
                            </div>
                          </div>
                          {currentBusiness?.id === biz.id && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Theme</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setTheme("light")}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                          theme === "light"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-800"
                        }`}
                      >
                        <div className="w-full h-16 rounded bg-white border border-gray-200 mb-2" />
                        <p className="text-sm font-medium">Light</p>
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                          theme === "dark"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-800"
                        }`}
                      >
                        <div className="w-full h-16 rounded bg-gray-900 border border-gray-700 mb-2" />
                        <p className="text-sm font-medium">Dark</p>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
