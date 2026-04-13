"use client";

import React, { useState } from "react";
import { Users, Plus, Loader2, Trash2, Shield, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";
import { useApi, apiPost, apiPut, apiDelete } from "@/hooks/use-api";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";

interface TeamMember {
  id: string; role: string; joinedAt: string;
  user: { id: string; name: string; email: string; avatar?: string; createdAt: string };
}

interface AuditLogEntry {
  id: string; action: string; entity: string; entityId?: string;
  details?: string; createdAt: string;
  user: { name: string; email: string };
}

const ROLES = [
  { value: "owner", label: "Owner", color: "danger" as const, desc: "Full control over everything" },
  { value: "manager", label: "Manager", color: "warning" as const, desc: "Operational control" },
  { value: "accountant", label: "Accountant", color: "success" as const, desc: "Financial operations" },
  { value: "staff", label: "Staff", color: "default" as const, desc: "Limited data entry" },
  { value: "viewer", label: "Viewer", color: "secondary" as const, desc: "Read-only access" },
];

export default function TeamPage() {
  const { currentBusiness, user } = useAuthStore();
  const [showInvite, setShowInvite] = useState(false);
  const [tab, setTab] = useState("members");

  const { data: members, loading: membersLoading, refetch: refetchMembers } = useApi<TeamMember[]>(
    currentBusiness ? `/api/team?businessId=${currentBusiness.id}` : null,
    [currentBusiness?.id]
  );

  const { data: auditData, loading: auditLoading } = useApi<{ logs: AuditLogEntry[]; total: number }>(
    currentBusiness && tab === "audit" ? `/api/audit?businessId=${currentBusiness.id}` : null,
    [currentBusiness?.id, tab]
  );

  const handleUpdateRole = async (memberId: string, role: string) => {
    if (!currentBusiness) return;
    await apiPut("/api/team", { id: memberId, role, businessId: currentBusiness.id });
    refetchMembers();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentBusiness || !confirm("Remove this team member?")) return;
    await apiDelete(`/api/team?id=${memberId}&businessId=${currentBusiness.id}`);
    refetchMembers();
  };

  return (
    <div>
      <Header
        title="Team"
        description="Manage team members and view audit logs"
        actions={
          <Button size="sm" onClick={() => setShowInvite(true)}>
            <Plus className="w-4 h-4 mr-1" /> Invite Member
          </Button>
        }
      />
      <div className="p-6 space-y-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-1" /> Members
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Clock className="w-4 h-4 mr-1" /> Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardContent className="p-0">
                {membersLoading ? (
                  <div className="p-6 space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : !members || members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <Users className="w-12 h-12 mb-3 text-gray-300" />
                    <p>No team members yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                                {getInitials(member.user.name)}
                              </div>
                              <div>
                                <p className="font-medium">{member.user.name}</p>
                                <p className="text-sm text-gray-500">{member.user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.user.id === user?.id ? (
                              <Badge variant={ROLES.find((r) => r.value === member.role)?.color || "default"} className="capitalize">
                                <Shield className="w-3 h-3 mr-1" /> {member.role}
                              </Badge>
                            ) : (
                              <Select
                                value={member.role}
                                onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                className="w-36"
                              >
                                {ROLES.map((r) => (
                                  <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(member.joinedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            {member.user.id !== user?.id && member.role !== "owner" && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleRemoveMember(member.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardContent className="p-0">
                {auditLoading ? (
                  <div className="p-6 space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : !auditData || auditData.logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <Clock className="w-12 h-12 mb-3 text-gray-300" />
                    <p>No audit logs yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditData.logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-sm">{formatDateTime(log.createdAt)}</TableCell>
                          <TableCell className="text-sm">{log.user.name}</TableCell>
                          <TableCell>
                            <Badge variant={
                              log.action === "create" ? "success" :
                              log.action === "update" ? "warning" :
                              log.action === "delete" ? "danger" : "default"
                            } className="capitalize">
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize text-sm">{log.entity.replace("_", " ")}</TableCell>
                          <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                            {log.details || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <InviteDialog
        open={showInvite}
        onClose={() => setShowInvite(false)}
        businessId={currentBusiness?.id || ""}
        onSuccess={refetchMembers}
      />
    </div>
  );
}

function InviteDialog({ open, onClose, businessId, onSuccess }: {
  open: boolean; onClose: () => void; businessId: string; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/team", { businessId, email, role });
      onSuccess();
      onClose();
      setEmail("");
      setRole("staff");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email Address *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="colleague@company.com" />
            <p className="text-xs text-gray-500 mt-1">The user must have an account first</p>
          </div>
          <div>
            <label className="text-sm font-medium">Role *</label>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.filter((r) => r.value !== "owner").map((r) => (
                <option key={r.value} value={r.value}>{r.label} - {r.desc}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Send Invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
