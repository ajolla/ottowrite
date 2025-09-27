import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  Users,
  Link as LinkIcon,
  Copy,
  Calendar,
  Eye,
  ExternalLink,
  Download,
  Clock
} from 'lucide-react';
import { ReferralDashboardData } from '@/types/referral';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const InfluencerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<ReferralDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'thisMonth' | 'lastMonth' | 'allTime'>('thisMonth');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/referral/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralUrl = (code: string) => {
    const url = `${window.location.origin}/ref/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Referral URL copied to clipboard');
  };

  const generateShareableLink = (code: string, platform: 'twitter' | 'facebook' | 'linkedin' | 'email') => {
    const url = `${window.location.origin}/ref/${code}`;
    const text = "Check out this amazing AI writing platform! Use my referral link to get started.";

    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      case 'email':
        return `mailto:?subject=${encodeURIComponent('Join OttoWrite AI')}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
      default:
        return url;
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'paid':
        return <Badge variant="default">Paid</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Referral Program Access</h3>
            <p className="text-muted-foreground mb-4">
              You don't have access to the referral program yet. Contact us to become an influencer partner.
            </p>
            <Button>Contact Support</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentAnalytics = dashboardData.analytics[selectedPeriod];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Influencer Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {dashboardData.partner.businessName}! Track your referral performance and earnings.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.partner.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              Pending: {formatCurrency(dashboardData.partner.pendingEarnings)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentAnalytics.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              {currentAnalytics.conversions} conversions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(currentAnalytics.conversionRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {currentAnalytics.signups} signups from {currentAnalytics.clicks} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeCodes.length}</div>
            <p className="text-xs text-muted-foreground">
              referral codes active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Period Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedPeriod === 'thisMonth' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('thisMonth')}
        >
          This Month
        </Button>
        <Button
          variant={selectedPeriod === 'lastMonth' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('lastMonth')}
        >
          Last Month
        </Button>
        <Button
          variant={selectedPeriod === 'allTime' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('allTime')}
        >
          All Time
        </Button>
      </div>

      <Tabs defaultValue="codes" className="w-full">
        <TabsList>
          <TabsTrigger value="codes">Referral Codes</TabsTrigger>
          <TabsTrigger value="conversions">Recent Conversions</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Codes</CardTitle>
              <CardDescription>
                Share these codes with your audience to earn commissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.activeCodes.length === 0 ? (
                <div className="text-center py-8">
                  <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Codes</h3>
                  <p className="text-muted-foreground">
                    Contact your admin to get referral codes created for you.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.activeCodes.map((code) => (
                    <Card key={code.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-lg font-bold">{code.code}</span>
                              <Badge variant="default">Active</Badge>
                            </div>
                            {code.description && (
                              <p className="text-sm text-muted-foreground mb-2">{code.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Uses: {code.currentUses}{code.maxUses && ` / ${code.maxUses}`}</span>
                              {code.expiresAt && (
                                <span>Expires: {formatDate(code.expiresAt.toISOString())}</span>
                              )}
                            </div>
                            {code.maxUses && (
                              <Progress
                                value={(code.currentUses / code.maxUses) * 100}
                                className="mt-2 h-2"
                              />
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyReferralUrl(code.code)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy URL
                            </Button>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(generateShareableLink(code.code, 'twitter'), '_blank')}
                              >
                                Twitter
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(generateShareableLink(code.code, 'facebook'), '_blank')}
                              >
                                Facebook
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(generateShareableLink(code.code, 'email'), '_blank')}
                              >
                                Email
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
              <CardDescription>
                Track your recent referral conversions and commissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.recentConversions.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Conversions Yet</h3>
                  <p className="text-muted-foreground">
                    Start sharing your referral codes to see conversions here.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.recentConversions.map((conversion) => (
                      <TableRow key={conversion.id}>
                        <TableCell>{formatDate(conversion.createdAt.toISOString())}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{conversion.conversionType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{conversion.subscriptionTier}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(conversion.commissionAmount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(conversion.commissionStatus)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                View your commission payouts and payment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.payoutHistory.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Payouts Yet</h3>
                  <p className="text-muted-foreground">
                    Your payouts will appear here once processed.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.payoutHistory.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>{formatDate(payout.createdAt.toISOString())}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payout.payoutMethod}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell>
                          {payout.transactionId ? (
                            <span className="font-mono text-sm">{payout.transactionId}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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
      </Tabs>
    </div>
  );
};