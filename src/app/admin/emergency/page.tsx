'use client';

/**
 * Emergency Controls Admin Page
 * Emergency pause/blacklist using EmergencyManagerService
 */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/lib/store/hooks';
import {
  emergencyManagerService,
  EmergencyManagerService,
  EmergencyStatus
} from '@/lib/services/contracts/EmergencyManagerService';
import {
  AlertTriangle,
  Shield,
  Ban,
  PlayCircle,
  PauseCircle
} from 'lucide-react';

export default function EmergencyControlsPage() {
  const { toast } = useToast();
  const { account } = useAppSelector((state) => state.wallet);

  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>({
    isPaused: false,
    pausedAt: BigInt(0),
    pauseReason: '',
    cooldownRemaining: BigInt(0)
  });

  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [blacklistAddress, setBlacklistAddress] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistType, setBlacklistType] = useState<'user' | 'contract'>(
    'user'
  );
  const [pauseReason, setPauseReason] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Load emergency status
   */
  useEffect(() => {
    if (!useMockData && account) {
      loadEmergencyStatus();
    }
  }, [account, useMockData]);

  const loadEmergencyStatus = async () => {
    try {
      const status = await emergencyManagerService.getEmergencyStatus();
      setEmergencyStatus(status);
    } catch (error) {
      console.error('Failed to load emergency status:', error);
    }
  };

  /**
   * Handle emergency pause
   */
  const handleEmergencyPause = async () => {
    if (!pauseReason) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for emergency pause',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      if (useMockData) {
        setEmergencyStatus({ ...emergencyStatus, isPaused: true });
        toast({
          title: 'Emergency Pause Activated',
          description: 'Marketplace has been paused'
        });
      } else {
        await emergencyManagerService.emergencyPause(pauseReason);

        toast({
          title: 'Emergency Pause Activated',
          description: 'Marketplace has been paused successfully'
        });

        setPauseReason('');
        await loadEmergencyStatus();
      }
    } catch (error) {
      toast({
        title: 'Pause Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to pause marketplace',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle emergency unpause
   */
  const handleEmergencyUnpause = async () => {
    setLoading(true);

    try {
      if (useMockData) {
        setEmergencyStatus({ ...emergencyStatus, isPaused: false });
        toast({
          title: 'Emergency Unpause',
          description: 'Marketplace has been unpaused'
        });
      } else {
        await emergencyManagerService.emergencyUnpause();

        toast({
          title: 'Emergency Unpause',
          description: 'Marketplace has been unpaused successfully'
        });

        await loadEmergencyStatus();
      }
    } catch (error) {
      toast({
        title: 'Unpause Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to unpause marketplace',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle blacklist
   */
  const handleBlacklist = async () => {
    if (!blacklistAddress || !blacklistReason) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      if (useMockData) {
        toast({
          title: 'Blacklisted',
          description: `Successfully blacklisted ${blacklistType}: ${blacklistAddress}`
        });
        setBlacklistDialogOpen(false);
      } else {
        if (blacklistType === 'user') {
          await emergencyManagerService.setUserBlacklist(
            blacklistAddress,
            true,
            blacklistReason
          );
        } else {
          await emergencyManagerService.setContractBlacklist(
            blacklistAddress,
            true,
            blacklistReason
          );
        }

        toast({
          title: 'Blacklisted',
          description: `Successfully blacklisted ${blacklistType}`
        });

        setBlacklistDialogOpen(false);
        setBlacklistAddress('');
        setBlacklistReason('');
      }
    } catch (error) {
      toast({
        title: 'Blacklist Failed',
        description:
          error instanceof Error ? error.message : 'Failed to blacklist',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">🚨 Emergency Controls</h2>
        <p className="text-muted-foreground">
          Emergency pause and blacklist management for platform security
        </p>
      </div>

      {useMockData && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ Mock Data Mode - Real contract integration disabled
          </p>
        </div>
      )}

      {/* Emergency Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Emergency Status
          </CardTitle>
          <CardDescription>Current marketplace emergency state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Marketplace Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      emergencyStatus.isPaused ? 'destructive' : 'default'
                    }
                  >
                    {emergencyStatus.isPaused ? 'PAUSED' : 'ACTIVE'}
                  </Badge>
                  {emergencyStatus.isPaused && emergencyStatus.pauseReason && (
                    <span className="text-sm text-muted-foreground">
                      Reason: {emergencyStatus.pauseReason}
                    </span>
                  )}
                </div>
              </div>
              {emergencyStatus.isPaused ? (
                <Button onClick={handleEmergencyUnpause} disabled={loading}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Unpause
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Reason for pause..."
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                  />
                  <Button
                    onClick={handleEmergencyPause}
                    disabled={loading}
                    variant="destructive"
                  >
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Emergency Pause
                  </Button>
                </div>
              )}
            </div>

            {emergencyStatus.cooldownRemaining > BigInt(0) && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Pause Cooldown Active</p>
                <p className="text-sm text-muted-foreground">
                  {EmergencyManagerService.formatCooldown(
                    emergencyStatus.cooldownRemaining
                  )}{' '}
                  remaining
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Blacklist Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Blacklist Management
          </CardTitle>
          <CardDescription>Block malicious users or contracts</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setBlacklistDialogOpen(true)}>
            <Ban className="h-4 w-4 mr-2" />
            Add to Blacklist
          </Button>
        </CardContent>
      </Card>

      {/* Blacklist Dialog */}
      <Dialog open={blacklistDialogOpen} onOpenChange={setBlacklistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Blacklist</DialogTitle>
            <DialogDescription>
              Block a user or contract from marketplace activities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={blacklistType === 'user' ? 'default' : 'outline'}
                  onClick={() => setBlacklistType('user')}
                >
                  User
                </Button>
                <Button
                  variant={blacklistType === 'contract' ? 'default' : 'outline'}
                  onClick={() => setBlacklistType('contract')}
                >
                  Contract
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={blacklistAddress}
                onChange={(e) => setBlacklistAddress(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Reason for blacklisting..."
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlacklistDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBlacklist}
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Blacklisting...' : 'Add to Blacklist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
