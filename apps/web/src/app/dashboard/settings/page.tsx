"use client";

import React from "react";
import { Settings, Bell, Shield, Palette, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@vantagepay/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your VantagePay account and preferences
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-indigo-500" />
              Profile
            </CardTitle>
            <CardDescription>
              Manage your account tier, email notifications, and linked wallets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              KYC tier upgrades and profile settings coming soon.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="w-4 h-4 text-indigo-500" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure transaction alerts, spending limits, and card activity notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Push and Telegram notifications coming soon.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-indigo-500" />
              Security
            </CardTitle>
            <CardDescription>
              Spending limits, card freeze defaults, and transaction signing preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Security settings coming soon.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="w-4 h-4 text-indigo-500" />
              Appearance
            </CardTitle>
            <CardDescription>
              Dark mode, light mode, and card theme preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Use the theme toggle in the sidebar to switch between dark and light mode.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
