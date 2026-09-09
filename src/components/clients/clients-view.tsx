"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Client, Lead, Poc } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AgencyBadge, WorkStatusBadge } from "@/components/shared/badges";
import { formatBudget, parseJsonArray } from "@/lib/constants";
import {
  updateClientPayment,
  updateClientWorkStatus,
} from "@/lib/actions/clients";

type ClientRow = Client & { lead: Lead & { pocs: Poc[] } };

export function ClientsView({
  clients,
  initialFilter = "all",
}: {
  clients: ClientRow[];
  initialFilter?: "all" | "outstanding";
}) {
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [agreed, setAgreed] = useState("");
  const [collected, setCollected] = useState("");
  const [filter, setFilter] = useState<"all" | "outstanding">(initialFilter);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    if (filter !== "outstanding") return clients;
    return clients.filter((c) => c.amountAgreed - c.amountCollected > 0);
  }, [clients, filter]);

  function openEdit(client: ClientRow) {
    setEditing(client);
    setAgreed(String(client.amountAgreed));
    setCollected(String(client.amountCollected));
  }

  function savePayment() {
    if (!editing) return;
    const amountAgreed = Number(agreed);
    const amountCollected = Number(collected);

    if (
      Number.isNaN(amountAgreed) ||
      Number.isNaN(amountCollected) ||
      amountAgreed < 0 ||
      amountCollected < 0
    ) {
      toast.error("Enter valid non-negative amounts");
      return;
    }
    if (amountCollected > amountAgreed) {
      toast.error("Collected cannot exceed agreed amount");
      return;
    }

    startTransition(async () => {
      try {
        await updateClientPayment(editing.id, {
          amountAgreed,
          amountCollected,
        });
        toast.success("Payment updated");
        setEditing(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        description={
          filter === "outstanding"
            ? "Clients with unpaid balance"
            : "Won deals — payments and work track (ongoing / completed)"
        }
      />
      <div className="mb-4 flex gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={filter === "outstanding" ? "default" : "outline"}
          onClick={() => setFilter("outstanding")}
        >
          Outstanding
        </Button>
      </div>
      {visible.length === 0 ? (
        <EmptyState
          title={
            filter === "outstanding" ? "No outstanding balances" : "No clients yet"
          }
          description={
            filter === "outstanding"
              ? "All clients are fully paid."
              : "Move a lead to Won to create a client automatically."
          }
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {visible.map((client) => {
              const projects = parseJsonArray(client.projects);
              const outstanding = Math.max(
                0,
                client.amountAgreed - client.amountCollected
              );
              return (
                <div
                  key={client.id}
                  className="rounded-lg border bg-card p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/leads/${client.leadId}`}
                      className="font-medium hover:underline"
                    >
                      {client.company}
                    </Link>
                    <div className="flex flex-col items-end gap-1">
                      <AgencyBadge agency={client.lead.agency} />
                      <WorkStatusBadge status={client.workStatus} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Agreed</p>
                      <p className="font-medium">
                        {formatBudget(client.amountAgreed)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Collected</p>
                      <p className="font-medium">
                        {formatBudget(client.amountCollected)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Outstanding</p>
                      <p className="font-medium">{formatBudget(outstanding)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                    {projects.join(", ") || "No projects"}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(client)}
                    >
                      Payment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          try {
                            await updateClientWorkStatus(
                              client.id,
                              client.workStatus === "Ongoing"
                                ? "Completed"
                                : "Ongoing"
                            );
                            toast.success("Work status updated");
                          } catch {
                            toast.error("Failed to update status");
                          }
                        });
                      }}
                    >
                      {client.workStatus === "Ongoing"
                        ? "Complete"
                        : "Reopen"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Work</TableHead>
                  <TableHead>Agreed</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((client) => {
                  const projects = parseJsonArray(client.projects);
                  const outstanding = Math.max(
                    0,
                    client.amountAgreed - client.amountCollected
                  );
                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <Link
                          href={`/leads/${client.leadId}`}
                          className="font-medium hover:underline"
                        >
                          {client.company}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <AgencyBadge agency={client.lead.agency} />
                      </TableCell>
                      <TableCell>
                        <WorkStatusBadge status={client.workStatus} />
                      </TableCell>
                      <TableCell>{formatBudget(client.amountAgreed)}</TableCell>
                      <TableCell>
                        {formatBudget(client.amountCollected)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatBudget(outstanding)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {projects.join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(client)}
                          >
                            Payment
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pending}
                            onClick={() => {
                              startTransition(async () => {
                                try {
                                  await updateClientWorkStatus(
                                    client.id,
                                    client.workStatus === "Ongoing"
                                      ? "Completed"
                                      : "Ongoing"
                                  );
                                  toast.success("Work status updated");
                                } catch {
                                  toast.error("Failed to update status");
                                }
                              });
                            }}
                          >
                            {client.workStatus === "Ongoing"
                              ? "Complete"
                              : "Reopen"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Payment — ${editing.company}` : "Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="amountAgreed">Amount agreed (INR)</Label>
              <Input
                id="amountAgreed"
                type="number"
                min={0}
                value={agreed}
                onChange={(e) => setAgreed(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="amountCollected">Amount collected (INR)</Label>
              <Input
                id="amountCollected"
                type="number"
                min={0}
                value={collected}
                onChange={(e) => setCollected(e.target.value)}
              />
            </div>
            {agreed !== "" && collected !== "" && !Number.isNaN(Number(agreed)) ? (
              <p className="text-xs text-muted-foreground">
                Outstanding:{" "}
                {formatBudget(
                  Math.max(0, Number(agreed) - Number(collected || 0))
                )}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={savePayment}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
