"use client";

/**
 * Emergency Controls Admin Page
 * Pause/unpause contracts in emergencies
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, PlayCircle, PauseCircle, Shield } from "lucide-react";

interface ContractState {
  name: string;
  address: string;
  paused: boolean;
  lastAction?: {
    type: "pause" | "unpause";
    timestamp: number;
    admin: string;
  };
}

export default function EmergencyControlsPage() {
  const { toast } = useToast();

  const [contracts, setContracts] = useState<ContractState[]>([
    {
      name: "Marketplace",
      address: "0x1234...5678",
      paused: false,
    },
    {
      name: "Auction Factory",
      address: "0x2345...6789",
      paused: false,
    },
    {
      name: "Offer Manager",
      address: "0x3456...7890",
      paused: false,
    },
    {
      name: "Bundle Manager",
      address: "0x4567...8901",
      paused: false,
    },
  ]);

  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractState | null>(
    null
  );
  const [action, setAction] = useState<"pause" | "unpause">("pause");

  /**
   * Handle pause/unpause contract
   */
  const handleTogglePause = async () => {
    if (!selectedContract) return;

    try {
      // Mock - in real app, call contract's pause/unpause functions
      // if (action === 'pause') {
      //   await contract.pause()
      // } else {
      //   await contract.unpause()
      // }

      setContracts((prev) =>
        prev.map((c) =>
          c.name === selectedContract.name
            ? {
                ...c,
                paused: action === "pause",
                lastAction: {
                  type: action,
                  timestamp: Date.now(),
                  admin: "0xAdmin...Address",
                },
              }
            : c
        )
      );

      toast({
        title: `Contract ${action === "pause" ? "Paused" : "Unpaused"}`,
        description: `${selectedContract.name} has been ${action}d`,
        variant: action === "pause" ? "destructive" : "default",
      });

      setConfirmDialog(false);
      setSelectedContract(null);
    } catch (error) {
      toast({
        title: "Action Failed",
        description:
          error instanceof Error ? error.message : "Failed to toggle contract state",
        variant: "destructive",
      });
    }
  };

  /**
   * Open confirmation dialog
   */
  const openConfirm = (contract: ContractState, newAction: "pause" | "unpause") => {
    setSelectedContract(contract);
    setAction(newAction);
    setConfirmDialog(true);
  };

  const pausedCount = contracts.filter((c) => c.paused).length;
  const activeCount = contracts.filter((c) => !c.paused).length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">🚨 Emergency Controls</h2>
        <p className="text-muted-foreground">
          Pause or unpause contracts during emergencies or maintenance
        </p>
      </div>

      {/* Warning Banner */}
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Critical System Controls:</strong> These actions will immediately
          affect all users. Only use in emergencies or planned maintenance. Always
          communicate with users before taking emergency actions.
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <PlayCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Operating normally</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Contracts</CardTitle>
            <PauseCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pausedCount}</div>
            <p className="text-xs text-muted-foreground">Emergency mode</p>
          </CardContent>
        </Card>
      </div>

      {/* Contract Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Status</CardTitle>
          <CardDescription>
            View and control the status of all platform contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div
                key={contract.name}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  contract.paused ? "bg-red-50 dark:bg-red-950/20" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        contract.paused ? "bg-red-500" : "bg-green-500"
                      }`}
                    ></div>
                    <h3 className="font-semibold">{contract.name}</h3>
                    <Badge variant={contract.paused ? "destructive" : "default"}>
                      {contract.paused ? "Paused" : "Active"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {contract.address}
                  </p>
                  {contract.lastAction && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last {contract.lastAction.type}d{" "}
                      {new Date(contract.lastAction.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {contract.paused ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openConfirm(contract, "unpause")}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Unpause
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openConfirm(contract, "pause")}
                    >
                      <PauseCircle className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {action === "pause" ? "Pause" : "Unpause"} Contract
            </DialogTitle>
            <DialogDescription>
              {selectedContract && (
                <>
                  Are you sure you want to {action}{" "}
                  <strong>{selectedContract.name}</strong>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <Alert variant={action === "pause" ? "destructive" : "default"}>
            <AlertDescription>
              {action === "pause" ? (
                <>
                  <strong>Warning:</strong> Pausing this contract will prevent all
                  users from interacting with it. This should only be done during
                  emergencies or planned maintenance.
                </>
              ) : (
                <>
                  <strong>Notice:</strong> Unpausing this contract will restore
                  normal functionality and allow users to interact with it again.
                </>
              )}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={action === "pause" ? "destructive" : "default"}
              onClick={handleTogglePause}
            >
              {action === "pause" ? "Pause Contract" : "Unpause Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

