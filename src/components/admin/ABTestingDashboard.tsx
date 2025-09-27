'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ABExperiment, ABExperimentResults, ABVariantResults } from '@/types/ab-testing';
import { PlatformABTesting, PLATFORM_AB_TESTS } from '@/lib/platform-ab-testing';
import { ABTestingEngine } from '@/lib/ab-testing-engine';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';

interface ABTestingDashboardProps {
  userId: string;
}

export function ABTestingDashboard({ userId }: ABTestingDashboardProps) {
  const [experiments, setExperiments] = useState<ABExperiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<ABExperiment | null>(null);
  const [results, setResults] = useState<ABExperimentResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      // In a real app, this would fetch from your API
      const mockExperiments: ABExperiment[] = [
        {
          id: 'exp_watermark_message',
          name: 'Watermark Message A/B Test',
          description: 'Testing different watermark messages for conversion optimization',
          hypothesis: 'More compelling watermark messaging will increase premium upgrades',
          feature: 'watermark',
          status: 'running',
          trafficAllocation: 50,
          variants: [
            {
              id: 'control',
              name: 'Standard Message',
              description: 'Current watermark message',
              isControl: true,
              trafficSplit: 50,
              config: {
                watermark: {
                  enabled: true,
                  customConfig: {
                    text: 'Created with OttoWrite AI',
                    subText: 'Upgrade to remove watermarks',
                    position: 'bottom-right',
                    style: {}
                  }
                }
              }
            },
            {
              id: 'variant_urgency',
              name: 'Urgency Message',
              description: 'Message with urgency and benefits',
              isControl: false,
              trafficSplit: 50,
              config: {
                watermark: {
                  enabled: true,
                  customConfig: {
                    text: 'Limited Time: Upgrade Now',
                    subText: 'Remove watermarks + unlock AI features',
                    position: 'bottom-right',
                    style: {}
                  }
                }
              }
            }
          ],
          targetAudience: {
            userTiers: ['free'],
            newUsersOnly: false
          },
          startDate: new Date('2024-01-15'),
          duration: 14,
          primaryMetric: 'conversion_rate',
          secondaryMetrics: ['document_exports', 'time_to_conversion'],
          conversionGoal: 'upgrade_to_premium',
          minimumSampleSize: 1000,
          minimumEffect: 10,
          confidenceLevel: 95,
          results: {
            status: 'significant_winner',
            winningVariant: 'variant_urgency',
            confidence: 97.5,
            pValue: 0.018,
            effect: 23.4,
            variantResults: [
              {
                variantId: 'control',
                participants: 1247,
                conversions: 89,
                conversionRate: 7.14,
                confidence: [5.8, 8.6],
                secondaryMetrics: {
                  document_exports: { value: 892, improvement: 0 },
                  time_to_conversion: { value: 4.2, improvement: 0 }
                }
              },
              {
                variantId: 'variant_urgency',
                participants: 1203,
                conversions: 106,
                conversionRate: 8.81,
                confidence: [7.3, 10.5],
                secondaryMetrics: {
                  document_exports: { value: 923, improvement: 3.5 },
                  time_to_conversion: { value: 3.8, improvement: -9.5 }
                }
              }
            ],
            dailyResults: [],
            calculatedAt: new Date()
          },
          createdBy: userId,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date()
        },
        {
          id: 'exp_pricing_display',
          name: 'Pricing Display Test',
          description: 'Testing monthly vs annual pricing display',
          hypothesis: 'Highlighting annual savings will increase subscription conversions',
          feature: 'pricing',
          status: 'running',
          trafficAllocation: 100,
          variants: [
            {
              id: 'monthly_focus',
              name: 'Monthly Pricing',
              description: 'Show monthly pricing prominently',
              isControl: true,
              trafficSplit: 50,
              config: {
                pricing: {
                  premiumPrice: 15,
                  enterprisePrice: 49,
                  features: ['unlimited_docs', 'ai_assistance', 'collaboration']
                }
              }
            },
            {
              id: 'annual_focus',
              name: 'Annual Pricing',
              description: 'Show annual pricing with savings',
              isControl: false,
              trafficSplit: 50,
              config: {
                pricing: {
                  premiumPrice: 12,
                  enterprisePrice: 39,
                  discountPercentage: 20,
                  features: ['unlimited_docs', 'ai_assistance', 'collaboration', 'priority_support']
                }
              }
            }
          ],
          targetAudience: {
            userTiers: ['free'],
            newUsersOnly: true
          },
          startDate: new Date('2024-01-10'),
          duration: 21,
          primaryMetric: 'subscription_rate',
          secondaryMetrics: ['page_views', 'feature_clicks'],
          conversionGoal: 'upgrade_to_premium',
          minimumSampleSize: 2000,
          minimumEffect: 15,
          confidenceLevel: 95,
          createdBy: userId,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date()
        }
      ];

      setExperiments(mockExperiments);
      if (mockExperiments.length > 0) {
        setSelectedExperiment(mockExperiments[0]);
        setResults(mockExperiments[0].results || null);
      }
    } catch (error) {
      console.error('Failed to load experiments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewExperiment = async (template: keyof typeof PLATFORM_AB_TESTS) => {
    const testTemplate = PLATFORM_AB_TESTS[template];

    const newExperiment: ABExperiment = {
      id: `exp_${Date.now()}`,
      name: testTemplate.name,
      description: testTemplate.description,
      hypothesis: `Testing ${testTemplate.name.toLowerCase()} to improve user experience and conversions`,
      feature: testTemplate.feature as any,
      status: 'draft',
      trafficAllocation: 50,
      variants: testTemplate.variants.map((variant, index) => ({
        id: `variant_${index}`,
        name: variant.name,
        description: `Variant testing ${variant.name.toLowerCase()}`,
        isControl: index === 0,
        trafficSplit: 50,
        config: variant.config
      })),
      targetAudience: {
        userTiers: ['free', 'premium'],
        newUsersOnly: false
      },
      startDate: new Date(),
      duration: 14,
      primaryMetric: 'conversion_rate',
      secondaryMetrics: ['user_engagement', 'feature_adoption'],
      conversionGoal: 'upgrade_to_premium',
      minimumSampleSize: 1000,
      minimumEffect: 10,
      confidenceLevel: 95,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setExperiments(prev => [...prev, newExperiment]);
  };

  const toggleExperimentStatus = async (experimentId: string) => {
    setExperiments(prev =>
      prev.map(exp =>
        exp.id === experimentId
          ? {
              ...exp,
              status: exp.status === 'running' ? 'paused' : 'running',
              updatedAt: new Date()
            }
          : exp
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatChartData = (results: ABVariantResults[]) => {
    return results.map(result => ({
      name: result.variantId === 'control' ? 'Control' : 'Variant',
      conversions: result.conversions,
      participants: result.participants,
      conversionRate: result.conversionRate
    }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading experiments...</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">A/B Testing Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your platform-wide experiments
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => createNewExperiment('WATERMARK_STRATEGY')}>
            New Watermark Test
          </Button>
          <Button onClick={() => createNewExperiment('PRICING_STRATEGY')} variant="outline">
            New Pricing Test
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Experiments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {experiments.filter(exp => exp.status === 'running').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Running tests across platform
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {experiments
                    .filter(exp => exp.results)
                    .reduce((sum, exp) =>
                      sum + (exp.results?.variantResults.reduce((vSum, v) => vSum + v.participants, 0) || 0), 0
                    ).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Users in active tests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Significant Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {experiments.filter(exp => exp.results?.status === 'significant_winner').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tests with clear winners
                </p>
              </CardContent>
            </Card>
          </div>

          {selectedExperiment && results && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedExperiment.name} - Performance</CardTitle>
                <CardDescription>Conversion rate comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatChartData(results.variantResults)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="conversionRate" fill="#8884d8" name="Conversion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="experiments" className="space-y-4">
          <div className="grid gap-4">
            {experiments.map((experiment) => (
              <Card key={experiment.id} className="w-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {experiment.name}
                        <Badge className={getStatusColor(experiment.status)}>
                          {experiment.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {experiment.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedExperiment(experiment);
                          setResults(experiment.results || null);
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => toggleExperimentStatus(experiment.id)}
                      >
                        {experiment.status === 'running' ? 'Pause' : 'Start'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Feature</p>
                      <p className="font-medium capitalize">{experiment.feature}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Traffic</p>
                      <p className="font-medium">{experiment.trafficAllocation}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{experiment.duration} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Variants</p>
                      <p className="font-medium">{experiment.variants.length}</p>
                    </div>
                  </div>

                  {experiment.results && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Results</span>
                        <Badge variant={experiment.results.status === 'significant_winner' ? 'default' : 'secondary'}>
                          {experiment.results.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Confidence</p>
                          <p className="font-medium">{experiment.results.confidence}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Effect</p>
                          <p className="font-medium">+{experiment.results.effect}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">P-value</p>
                          <p className="font-medium">{experiment.results.pValue.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Winner</p>
                          <p className="font-medium">
                            {experiment.results.winningVariant || 'TBD'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {selectedExperiment && results ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedExperiment.name} - Detailed Results</CardTitle>
                  <CardDescription>
                    Statistical analysis and variant performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{results.confidence}%</div>
                        <div className="text-sm text-muted-foreground">Confidence Level</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">+{results.effect}%</div>
                        <div className="text-sm text-muted-foreground">Improvement</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{results.pValue.toFixed(3)}</div>
                        <div className="text-sm text-muted-foreground">P-value</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">Variant Performance</h4>
                      {results.variantResults.map((variant) => (
                        <div key={variant.variantId} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="font-medium">
                              {variant.variantId === 'control' ? 'Control' : `Variant ${variant.variantId}`}
                            </h5>
                            <Badge variant={variant.variantId === results.winningVariant ? 'default' : 'secondary'}>
                              {variant.variantId === results.winningVariant ? 'Winner' : 'Loser'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Participants</p>
                              <p className="font-medium">{variant.participants.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Conversions</p>
                              <p className="font-medium">{variant.conversions.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Rate</p>
                              <p className="font-medium">{variant.conversionRate.toFixed(2)}%</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <Progress
                              value={variant.conversionRate}
                              className="h-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Select an experiment to view detailed results</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform A/B Testing Analytics</CardTitle>
              <CardDescription>
                Overall performance metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Experiment Success Rate</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Successful Tests</span>
                      <span className="font-medium">
                        {experiments.filter(exp => exp.results?.status === 'significant_winner').length} / {experiments.length}
                      </span>
                    </div>
                    <Progress value={
                      (experiments.filter(exp => exp.results?.status === 'significant_winner').length / experiments.length) * 100
                    } />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">Feature Coverage</h4>
                  <div className="space-y-2">
                    {['watermark', 'pricing', 'ui', 'ai_assistant'].map(feature => (
                      <div key={feature} className="flex justify-between items-center">
                        <span className="capitalize">{feature.replace('_', ' ')}</span>
                        <Badge variant="outline">
                          {experiments.filter(exp => exp.feature === feature).length} tests
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}