import { useGetProfile, useUpdateProfile } from "@workspace/api-client-react";
import { Settings, Save, Moon, Sun, Monitor, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileUpdateTheme } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetProfileQueryKey } from "@workspace/api-client-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: profile } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const qc = useQueryClient();
  const { setTheme } = useTheme();

  const [displayName, setDisplayName] = useState("");
  const [themePref, setThemePref] = useState<ProfileUpdateTheme>("dark");
  const [timezone, setTimezone] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setThemePref(profile.theme as ProfileUpdateTheme);
      setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate({ data: { displayName, theme: themePref, timezone } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        // Sync next-themes
        if (themePref === 'dark') setTheme('dark');
        else if (themePref === 'light') setTheme('light');
        else if (themePref === 'amoled') setTheme('amoled');
        
        toast.success("Preferences saved");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto h-full animate-in fade-in duration-300 pb-8">
      <div className="flex items-end justify-between mb-8 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            System Configuration
          </h1>
          <p className="text-muted-foreground mt-2">Adjust your command deck parameters.</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>How the system addresses you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Commander" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>Interface</CardTitle>
            <CardDescription>Visual preferences and chronometry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Theme Paradigm</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div 
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${themePref === 'light' ? 'border-primary ring-1 ring-primary/30 bg-primary/5' : 'border-border bg-background hover:bg-secondary/50'}`}
                  onClick={() => setThemePref('light')}
                >
                  <Sun className="h-6 w-6 mb-2 text-orange-500" />
                  <span className="text-sm font-bold">Paper Command</span>
                </div>
                <div 
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${themePref === 'dark' ? 'border-primary ring-1 ring-primary/30 bg-primary/5' : 'border-border bg-background hover:bg-secondary/50'}`}
                  onClick={() => setThemePref('dark')}
                >
                  <Moon className="h-6 w-6 mb-2 text-indigo-400" />
                  <span className="text-sm font-bold">Midnight</span>
                </div>
                <div 
                  className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all ${themePref === 'amoled' ? 'border-primary ring-1 ring-primary/30 bg-primary/5' : 'border-border bg-background hover:bg-secondary/50'}`}
                  onClick={() => setThemePref('amoled')}
                >
                  <Monitor className="h-6 w-6 mb-2 text-zinc-400" />
                  <span className="text-sm font-bold">Deep Space</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Timezone</Label>
              <div className="flex items-center gap-3 mt-1">
                 <Clock className="h-4 w-4 text-muted-foreground" />
                 <Input value={timezone} onChange={e => setTimezone(e.target.value)} className="font-mono text-sm" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Standard IANA timezone string (e.g. America/Los_Angeles).</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleSave} disabled={updateProfile.isPending} className="font-bold gap-2">
            <Save className="h-4 w-4" /> Apply Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
