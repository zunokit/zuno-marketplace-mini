"use client";

/**
 * Timelock Management Admin Page
 * Manage time-locked administrative actions for security
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/lib/store/hooks";
import { isMockDataEnabled } from "@/lib/services/mock/mockDataService";
import {
  timelockService,
  TimelockService,
  PendingAction,
  ActionStatus,
} from "@/lib/services/contracts/TimelockService";
import { Clock, Play, X, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TimelockManagementPage() {
  const { toast } = useToast();
  const { account } = useAppSelector((state) => state.wallet);
  const [useMockData] = useState(isMockDataEnabled());

  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [targetContract, setTargetContract] = useState("");
  const [callData, setCallData] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Load pending actions
   */
  useEffect(() => {
    if (!useMockData && account) {
      loadPendingActions();
    }
  }, [account, useMockData]);

  const loadPendingActions = async () => {
    try {
      const actions = await timelockService.getPendingActions();
      setPendingActions(actions);
    } catch (error) {
      console.error("Failed to load pending actions:", error);
    }
  };

  /**
   * Handle schedule action
   */
  const handleScheduleAction = async () => {
    if (!targetContract || !callData) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (useMockData) {
        toast({
          title: "Action Scheduled",
          description: "Action has been scheduled successfully",
        });
        setScheduleDialogOpen(false);
      } else {
        const { actionId } = await timelockService.scheduleAction(
          targetContract,
          callData,
          BigInt(0),
          description
        );

        toast({
          title: "Action Scheduled",
          description: `Action ID: ${actionId}`,
        });

        setScheduleDialogOpen(false);
        setTargetContract("");
        setCallData("");
        setDescription("");
        await loadPendingActions();
      }
    } catch (error) {
      toast({
        title: "Schedule Failed",
        description:
          error instanceof Error ? error.message : "Failed to schedule action",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle execute action
   */
  const handleExecuteAction = async (actionId: string) => {
    setLoading(true);

    try {
      if (useMockData) {
        toast({
          title: "Action Executed",
          description: "Action has been executed successfully",
        });
      } else {
        await timelockService.executeAction(actionId);

        toast({
          title: "Action Executed",
          description: "Action has been executed successfully",
        });

        await loadPendingActions();
      }
    } catch (error) {
      toast({
        title: "Execution Failed",
        description:
          error instanceof Error ? error.message : "Failed to execute action",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancelAction = async (actionId: string) => {
    setLoading(true);

    try {
      if (useMockData) {
        toast({
          title: "Action Cancelled",
          description: "Action has been cancelled successfully",
        });
      } else {
        await timelockService.cancelAction(actionId);

        toast({
          title: "Action Cancelled",
          description: "Action has been cancelled successfully",
        });

        await loadPendingActions();
      }
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description:
          error instanceof Error ? error.message : "Failed to cancel action",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">⏰ Timelock Management</h2>
        <p className="text-muted-foreground">
          Manage time-locked administrative actions for security
        </p>
      </div>

      {useMockData && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ Mock Data Mode - Real contract integration disabled
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mb-6">
        <Button onClick={() => setScheduleDialogOpen(true)}>
          <Clock className="h-4 w-4 mr-2" />
          Schedule Action
        </Button>
      </div>

      {/* Pending Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pending Actions
          </CardTitle>
          <CardDescription>
            Time-locked actions waiting for execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingActions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pending actions
            </p>
          ) : (
            <div className="space-y-4">
              {pendingActions.map((action) => (
                <Card key={action.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {action.action.description ||
                              `Action on ${action.action.target.slice(
                                0,
                                10
                              )}...`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Proposer: {action.action.proposer.slice(0, 6)}...
                            {action.action.proposer.slice(-4)}
                          </p>
                        </div>
                        <Badge
                          variant={action.isReady ? "default" : "secondary"}
                        >
                          {action.isReady
                            ? "Ready"
                            : TimelockService.formatTimeRemaining(
                                action.timeRemaining
                              )}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        {action.isReady ? (
                          <Button
                            size="sm"
                            onClick={() => handleExecuteAction(action.id)}
                            disabled={loading}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Execute
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelAction(action.id)}
                            disabled={loading}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Action Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Timelock Action</DialogTitle>
            <DialogDescription>
              Schedule an administrative action with time delay
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="target">Target Contract</Label>
              <Input
                id="target"
                placeholder="0x..."
                value={targetContract}
                onChange={(e) => setTargetContract(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="calldata">Call Data (Encoded)</Label>
              <Textarea
                id="calldata"
                placeholder="0x..."
                value={callData}
                onChange={(e) => setCallData(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Encoded function call data
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this action does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">⏱️ Timelock Duration</p>
              <p className="text-sm text-muted-foreground">
                48 hours (default)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Actions can be executed after the timelock period
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleScheduleAction} disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
