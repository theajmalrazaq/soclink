"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Award, Download, Loader, Mail } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { Certificate } from "./Certificate";
import { sendCertificateEmail } from "@/lib/emailService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEmailConfig } from "@/lib/emailConfig";

interface CertificateGeneratorProps {
  eventId: number | string;
  eventName: string;
  eventDate: string | Date;
  responses: any[];
  isCompetition?: boolean;
  winners?: any[];
}

export function CertificateGenerator({
  eventId,
  eventName,
  eventDate,
  responses,
  isCompetition,
  winners = [],
}: CertificateGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedType, setSelectedType] = useState("all");
  const [actionType, setActionType] = useState("download");
  const [currentCertificate, setCurrentCertificate] = useState<any>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix =
      getEmailConfig()
        .brandName?.replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 6)
        .toUpperCase() || "CERT";
    return `${prefix}-${result}`;
  };

  const getTargetUsers = () => {
    let users: any[] = [];

    if (selectedType === "winners" && isCompetition) {
      users = winners.map((w: any) => {
        const response = responses.find((r: any) => r.id === w.response_id) || {};
        return {
          ...response,
          isWinner: true,
          position: w.position,
          members: [
            {
              name: response.member_one_name,
              roll: response.member_one_rollno,
              email: response.member_one_numail,
            },
            ...(response.member_two_name
              ? [
                  {
                    name: response.member_two_name,
                    roll: response.member_two_rollno,
                    email: response.member_two_numail,
                  },
                ]
              : []),
          ],
        };
      });
    } else {
      let filtered = responses;
      if (selectedType === "verified") {
        filtered = responses.filter((r: any) => r.status === true);
      } else if (selectedType === "present") {
        filtered = responses.filter((r: any) => r.attendance === true || r.attendence === true);
      }

      users = filtered.map((r: any) => ({
        ...r,
        isWinner: false,
        members: isCompetition
          ? [
              {
                name: r.member_one_name,
                roll: r.member_one_rollno,
                email: r.member_one_numail,
              },
              ...(r.member_two_name
                ? [
                    {
                      name: r.member_two_name,
                      roll: r.member_two_rollno,
                      email: r.member_two_numail,
                    },
                  ]
                : []),
            ]
          : [{ name: r.name, roll: r.roll_no, email: r.nu_email || r.email }],
      }));
    }
    return users;
  };

  const processUser = async (user: any, member: any, isWinner: boolean, position: any) => {
    let code: string;
    let existingCert: any = null;
    try {
      const res = await fetch(
        `/api/events/${eventId}/certifications?name=${encodeURIComponent(member.name)}`,
      );
      const json = await res.json();
      existingCert = json.certificate;
    } catch {}

    if (existingCert && existingCert.code) {
      code = existingCert.code;
    } else {
      code = generateCode();
      try {
        await fetch(`/api/events/${eventId}/certifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: member.name,
            code: code,
          }),
        });
      } catch (insertError) {
        console.error("Error inserting certificate:", insertError);
      }
    }

    setCurrentCertificate({
      name: member.name,
      eventName,
      date: eventDate,
      code,
      type: isWinner ? "Winner" : "Participant",
      position,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    if (certificateRef.current) {
      try {
        const dataUrl = await toPng(certificateRef.current, {
          cacheBust: true,
          pixelRatio: 1.5,
        });

        if (actionType === "download") {
          const link = document.createElement("a");
          link.download = `${member.name}_${eventName || "Event"}_Certificate.png`;
          link.href = dataUrl;
          link.click();
        } else {
          if (!member.email) {
            console.warn(`No email for user ${member.name}`);
            return;
          }

          const base64Content = dataUrl.split(",")[1];
          const safeEventName = (eventName || "Event").replace(/[^a-z0-9]/gi, "_");

          await sendCertificateEmail({
            to: member.email,
            recipientName: member.name,
            eventName: eventName || "Event",
            eventDate: new Date(eventDate).toLocaleDateString(),
            certificateUrl: "#",
            position: isWinner ? position : undefined,
            attachments: [
              {
                filename: `${safeEventName}_Certificate.png`,
                content: base64Content,
                encoding: "base64",
              },
            ],
          });
        }
      } catch (err) {
        console.error("Error processing certificate:", err);
        toast.error(`Failed to process certificate for ${member.name}`);
      }
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setProgress(0);
    const users = getTargetUsers();
    let totalOperations = 0;

    users.forEach((u: any) => (totalOperations += u.members?.length || 0));

    let completed = 0;

    try {
      for (const user of users) {
        for (const member of user.members || []) {
          await processUser(user, member, user.isWinner, user.position);
          completed++;
          setProgress(Math.round((completed / (totalOperations || 1)) * 100));

          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
      toast.success(`Successfully generated ${completed} certificates`);
      setIsOpen(false);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("An error occurred during generation");
    } finally {
      setLoading(false);
      setCurrentCertificate(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="h-11 gap-2">
            <Award className="w-4 h-4" />
            Certificates
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate Certificates</DialogTitle>
            <DialogDescription>
              Generate and download certificates for participants or winners.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Tabs value={actionType} onValueChange={setActionType} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="download">Download</TabsTrigger>
                <TabsTrigger value="email">Send Email</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label>Select Recipients</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Registrations</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="present">Present Only</SelectItem>
                  {isCompetition && <SelectItem value="winners">Winners Only</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Please do not close this window.{" "}
                  {actionType === "download" ? "Downloads" : "Emails"} will start automatically.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : actionType === "download" ? (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate & Download
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Generate & Send Emails
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed left-[-9999px] top-[-9999px]">
        {currentCertificate && <Certificate ref={certificateRef} {...currentCertificate} />}
      </div>
    </>
  );
}
