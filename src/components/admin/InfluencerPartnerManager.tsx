import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Plus,
  Edit,
  DollarSign,
  TrendingUp,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  ExternalLink
} from 'lucide-react';
import { InfluencerPartner, ReferralCode, AdminReferralOverview } from '@/types/referral';
import { toast } from 'sonner';

interface InfluencerPartnerManagerProps {
  userRole: 'admin' | 'super_admin';
}

export const InfluencerPartnerManager = ({ userRole }: InfluencerPartnerManagerProps) => {
  const [partners, setPartners] = useState<InfluencerPartner[]>([]);
  const [overview, setOverview] = useState<AdminReferralOverview | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<InfluencerPartner | null>(null);
  const [partnerCodes, setPartnerCodes] = useState<ReferralCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);

  // Form states
  const [newPartnerForm, setNewPartnerForm] = useState({
    contactEmail: '',
    businessName: '',
    partnerType: 'influencer' as const,
    socialMedia: [{ platform: 'instagram' as const, handle: '', followers: 0 }],
    commissionRate: 200, // $2.00 in cents
    payoutMethod: 'paypal' as const,
    payoutDetails: { email: '' }
  });

  const [newCodeForm, setNewCodeForm] = useState({
    customCode: '',
    description: '',
    maxUses: 0,
    expiresAt: ''
  });

  useEffect(() => {
    loadOverview();
    loadPartners();
  }, []);

  const loadOverview = async () => {
    try {
      const response = await fetch('/api/admin/referrals/overview');
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (error) {
      console.error('Failed to load overview:', error);
    }
  };

  const loadPartners = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/referrals/partners');
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      }
    } catch (error) {
      console.error('Failed to load partners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPartnerCodes = async (partnerId: string) => {
    try {
      const response = await fetch(`/api/admin/referrals/partners/${partnerId}/codes`);
      if (response.ok) {
        const data = await response.json();
        setPartnerCodes(data);
      }
    } catch (error) {
      console.error('Failed to load partner codes:', error);
    }
  };

  const createPartner = async () => {
    try {
      const response = await fetch('/api/admin/referrals/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartnerForm)
      });

      if (response.ok) {
        toast.success('Influencer partner created successfully');
        setShowCreateDialog(false);
        setNewPartnerForm({
          contactEmail: '',
          businessName: '',
          partnerType: 'influencer',
          socialMedia: [{ platform: 'instagram', handle: '', followers: 0 }],
          commissionRate: 200,
          payoutMethod: 'paypal',
          payoutDetails: { email: '' }
        });
        loadPartners();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create partner');
      }
    } catch (error) {
      toast.error('Failed to create partner');
    }
  };

  const createReferralCode = async () => {
    if (!selectedPartner) return;

    try {
      const response = await fetch(`/api/admin/referrals/partners/${selectedPartner.id}/codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customCode: newCodeForm.customCode || undefined,
          description: newCodeForm.description || undefined,
          maxUses: newCodeForm.maxUses || undefined,
          expiresAt: newCodeForm.expiresAt ? new Date(newCodeForm.expiresAt).toISOString() : undefined
        })
      });

      if (response.ok) {
        toast.success('Referral code created successfully');
        setShowCodeDialog(false);
        setNewCodeForm({ customCode: '', description: '', maxUses: 0, expiresAt: '' });
        loadPartnerCodes(selectedPartner.id);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create referral code');
      }
    } catch (error) {
      toast.error('Failed to create referral code');
    }
  };

  const updatePartnerStatus = async (partnerId: string, status: 'active' | 'inactive' | 'suspended') => {
    try {
      const response = await fetch(`/api/admin/referrals/partners/${partnerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`Partner status updated to ${status}`);
        loadPartners();
      } else {
        toast.error('Failed to update partner status');
      }
    } catch (error) {
      toast.error('Failed to update partner status');
    }
  };

  const copyReferralUrl = (code: string) => {
    const url = `${window.location.origin}/ref/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Referral URL copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalPartners}</div>
              <p className="text-xs text-muted-foreground">
                {overview.activePartners} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalConversions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commissions Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview.totalCommissionsPaid)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview.pendingPayouts)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="partners" className="w-full">
        <TabsList>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="codes">Referral Codes</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Influencer Partners</h3>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Influencer Partner</DialogTitle>
                  <DialogDescription>
                    Add a new influencer partner to the referral program.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Contact Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={newPartnerForm.contactEmail}
                        onChange={(e) => setNewPartnerForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="partner@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-name">Business Name</Label>
                      <Input
                        id="business-name"
                        value={newPartnerForm.businessName}
                        onChange={(e) => setNewPartnerForm(prev => ({ ...prev, businessName: e.target.value }))}
                        placeholder="Influencer Name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="partner-type">Partner Type</Label>
                      <Select
                        value={newPartnerForm.partnerType}
                        onValueChange={(value: any) => setNewPartnerForm(prev => ({ ...prev, partnerType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="influencer">Influencer</SelectItem>
                          <SelectItem value="affiliate">Affiliate</SelectItem>
                          <SelectItem value="brand_ambassador">Brand Ambassador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commission-rate">Commission Rate ($)</Label>
                      <Input
                        id="commission-rate"
                        type="number"
                        step="0.01"
                        value={newPartnerForm.commissionRate / 100}
                        onChange={(e) => setNewPartnerForm(prev => ({
                          ...prev,
                          commissionRate: Math.round(parseFloat(e.target.value) * 100)
                        }))}
                        placeholder="2.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social-handle">Social Media Handle</Label>
                    <div className="flex gap-2">
                      <Select
                        value={newPartnerForm.socialMedia[0].platform}
                        onValueChange={(value: any) => setNewPartnerForm(prev => ({
                          ...prev,
                          socialMedia: [{ ...prev.socialMedia[0], platform: value }]
                        }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="@username"
                        value={newPartnerForm.socialMedia[0].handle}
                        onChange={(e) => setNewPartnerForm(prev => ({
                          ...prev,
                          socialMedia: [{ ...prev.socialMedia[0], handle: e.target.value }]
                        }))}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Followers"
                        type="number"
                        value={newPartnerForm.socialMedia[0].followers}
                        onChange={(e) => setNewPartnerForm(prev => ({
                          ...prev,
                          socialMedia: [{ ...prev.socialMedia[0], followers: parseInt(e.target.value) || 0 }]
                        }))}
                        className="w-32"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payout-method">Payout Method</Label>
                      <Select
                        value={newPartnerForm.payoutMethod}
                        onValueChange={(value: any) => setNewPartnerForm(prev => ({ ...prev, payoutMethod: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payout-email">PayPal Email</Label>
                      <Input
                        id="payout-email"
                        type="email"
                        value={newPartnerForm.payoutDetails.email}
                        onChange={(e) => setNewPartnerForm(prev => ({
                          ...prev,
                          payoutDetails: { ...prev.payoutDetails, email: e.target.value }
                        }))}
                        placeholder="payout@example.com"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createPartner}>Create Partner</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Social Media</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{partner.businessName}</div>
                          <div className="text-sm text-muted-foreground">{partner.contactEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{partner.partnerType}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(partner.status)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatCurrency(partner.totalEarnings)}</div>
                          <div className="text-sm text-muted-foreground">
                            Pending: {formatCurrency(partner.pendingEarnings)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {partner.socialMedia.length > 0 && (
                          <div className="text-sm">
                            {partner.socialMedia[0].platform}: {partner.socialMedia[0].handle}
                            {partner.socialMedia[0].followers && (
                              <div className="text-muted-foreground">
                                {partner.socialMedia[0].followers.toLocaleString()} followers
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPartner(partner);
                              loadPartnerCodes(partner.id);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {partner.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePartnerStatus(partner.id, 'inactive')}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePartnerStatus(partner.id, 'active')}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Partner Details Modal */}
        {selectedPartner && (
          <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedPartner.businessName} - Referral Codes</DialogTitle>
                <DialogDescription>
                  Manage referral codes for this partner
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold">Referral Codes</h4>
                  <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Referral Code</DialogTitle>
                        <DialogDescription>
                          Create a new referral code for {selectedPartner.businessName}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="custom-code">Custom Code (optional)</Label>
                          <Input
                            id="custom-code"
                            value={newCodeForm.customCode}
                            onChange={(e) => setNewCodeForm(prev => ({ ...prev, customCode: e.target.value }))}
                            placeholder="Leave empty for auto-generation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description (optional)</Label>
                          <Textarea
                            id="description"
                            value={newCodeForm.description}
                            onChange={(e) => setNewCodeForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Campaign description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="max-uses">Max Uses (optional)</Label>
                            <Input
                              id="max-uses"
                              type="number"
                              value={newCodeForm.maxUses || ''}
                              onChange={(e) => setNewCodeForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                              placeholder="Unlimited"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expires-at">Expires At (optional)</Label>
                            <Input
                              id="expires-at"
                              type="date"
                              value={newCodeForm.expiresAt}
                              onChange={(e) => setNewCodeForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCodeDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createReferralCode}>Create Code</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell>
                          <div className="font-mono font-medium">{code.code}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(code.status)}</TableCell>
                        <TableCell>
                          {code.currentUses}
                          {code.maxUses && ` / ${code.maxUses}`}
                        </TableCell>
                        <TableCell>{code.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyReferralUrl(code.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/ref/${code.code}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Tabs>
    </div>
  );
};