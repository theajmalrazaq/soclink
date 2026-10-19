"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ExternalLink, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CredentialStatus = {
  configured: boolean;
  source: "settings" | "environment" | "none";
  canSave: boolean;
};

export default function GroqSettings() {
  const [status, setStatus] = useState<CredentialStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch("/api/assistant/credentials", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load GroqCloud settings.");
        if (active) setStatus(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load GroqCloud settings.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiKey.trim() || saving) return;
    setSaving(true);
    setError("");
    setTestSuccess(false);
    try {
      const response = await apiFetch("/api/assistant/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save GroqCloud key.");
      setStatus(result);
      setApiKey("");
      setShowKey(false);
      setTestSuccess(false);
      toast.success("GroqCloud API key saved securely.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save GroqCloud key.");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (testing || saving) return;
    setTesting(true);
    setTestSuccess(false);
    setError("");
    try {
      const response = await apiFetch("/api/assistant/credentials/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not test GroqCloud connection.");
      setTestSuccess(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not test GroqCloud connection.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-xs lg:col-span-7">
        <CardHeader>
          <CardTitle>GroqCloud API key</CardTitle>
          <CardDescription>Connect the dashboard assistant to your GroqCloud account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groq-api-key">API key</Label>
              <div className="relative">
                <Input
                  id="groq-api-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(event) => {
                    setApiKey(event.target.value);
                    setTestSuccess(false);
                    setError("");
                  }}
                  placeholder={status?.configured ? "Enter a new key to replace the current one" : "Paste your GroqCloud API key"}
                  autoComplete="new-password"
                  spellCheck={false}
                  maxLength={500}
                  className="pr-12 font-mono"
                  disabled={saving || testing || loading}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((current) => !current)}
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">The saved key is never sent back to the browser. Enter a new key to replace it.</p>
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {testSuccess && <p role="status" className="text-sm text-green-600 dark:text-green-400">GroqCloud connection successful.</p>}
            {status?.canSave === false && <p className="text-sm text-destructive">Set SETTINGS_ENCRYPTION_KEY on the server to save an encrypted key.</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || testing || loading || !apiKey.trim() || status?.canSave === false}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Save API key
              </Button>
              <Button type="button" variant="outline" onClick={testConnection} disabled={testing || saving || loading || (!apiKey.trim() && !status?.configured)}>
                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {testing ? "Testing…" : "Test API"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-xs lg:col-span-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />Connection status</CardTitle>
          <CardDescription>Used to prepare drafts in the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{loading ? "Checking configuration…" : status?.source === "settings" ? "Configured · encrypted in database" : status?.source === "environment" ? "Configured · server environment" : "No API key configured"}</p>
          <p className="text-muted-foreground">Only users with settings access can replace the key. The assistant still requires confirmation before creating a record.</p>
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            Get an API key from GroqCloud <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
