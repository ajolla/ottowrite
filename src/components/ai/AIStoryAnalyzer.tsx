import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Clock,
  Users,
  MessageSquare,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

interface StoryAnalysis {
  pacing: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  characterDevelopment: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  dialogue: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  plot: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  style: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  overallScore: number;
  wordCount: number;
  readingTime: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
}

interface AIStoryAnalyzerProps {
  content: string;
  title: string;
  genre: string;
  characters: string[];
  onAnalysisComplete?: (analysis: StoryAnalysis) => void;
}

export const AIStoryAnalyzer = ({
  content,
  title,
  genre,
  characters,
  onAnalysisComplete,
}: AIStoryAnalyzerProps) => {
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { customRequest } = useAI();

  const analyzeStory = async () => {
    if (!content.trim()) {
      toast.error('No content to analyze');
      return;
    }

    setIsAnalyzing(true);

    try {
      const analysisPrompt = `
Analyze this ${genre} story comprehensively and provide detailed feedback:

Title: ${title}
Characters: ${characters.join(', ')}
Word Count: ${content.split(' ').length}

Content:
${content}

Please analyze the following aspects and provide scores (1-10) and specific, actionable feedback:

1. PACING: How well does the story maintain engagement and flow?
2. CHARACTER DEVELOPMENT: How well-developed and believable are the characters?
3. DIALOGUE: How natural and effective is the dialogue?
4. PLOT: How compelling and well-structured is the plot?
5. WRITING STYLE: How clear, engaging, and polished is the writing?

For each aspect, provide:
- A score from 1-10
- Specific feedback about strengths and weaknesses
- 2-3 actionable suggestions for improvement

Also provide:
- Overall story sentiment (positive/neutral/negative/mixed)
- Overall score (average of all aspects)

Format your response as a detailed analysis with clear sections for each aspect.
`;

      const response = await customRequest(analysisPrompt);

      if (response) {
        const parsedAnalysis = parseAnalysisResponse(response.content);
        setAnalysis(parsedAnalysis);
        onAnalysisComplete?.(parsedAnalysis);
        toast.success('Story analysis completed!');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze story. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseAnalysisResponse = (response: string): StoryAnalysis => {
    // Simple parsing - in a real app, you'd want more robust parsing
    const wordCount = content.split(' ').length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    // Extract scores and feedback (simplified parsing)
    const extractScore = (section: string): number => {
      const match = response.match(new RegExp(`${section}.*?(?:score|rating).*?(\\d+)`));
      return match ? parseInt(match[1]) : 7; // Default score
    };

    const extractFeedback = (section: string): string => {
      const match = response.match(new RegExp(`${section}.*?\\n([^\\n]+)`));
      return match ? match[1] : 'Good work on this aspect.';
    };

    const extractSuggestions = (section: string): string[] => {
      // Simple extraction - could be more sophisticated
      return [
        'Continue developing this aspect',
        'Consider adding more detail',
        'Look for opportunities to enhance this element'
      ];
    };

    const pacing = {
      score: extractScore('PACING'),
      feedback: extractFeedback('PACING'),
      suggestions: extractSuggestions('PACING'),
    };

    const characterDevelopment = {
      score: extractScore('CHARACTER'),
      feedback: extractFeedback('CHARACTER'),
      suggestions: extractSuggestions('CHARACTER'),
    };

    const dialogue = {
      score: extractScore('DIALOGUE'),
      feedback: extractFeedback('DIALOGUE'),
      suggestions: extractSuggestions('DIALOGUE'),
    };

    const plot = {
      score: extractScore('PLOT'),
      feedback: extractFeedback('PLOT'),
      suggestions: extractSuggestions('PLOT'),
    };

    const style = {
      score: extractScore('STYLE'),
      feedback: extractFeedback('STYLE'),
      suggestions: extractSuggestions('STYLE'),
    };

    const overallScore = Math.round(
      (pacing.score + characterDevelopment.score + dialogue.score + plot.score + style.score) / 5
    );

    // Determine sentiment based on content analysis
    const sentiment = determineSentiment(response);

    return {
      pacing,
      characterDevelopment,
      dialogue,
      plot,
      style,
      overallScore,
      wordCount,
      readingTime,
      sentiment,
    };
  };

  const determineSentiment = (text: string): 'positive' | 'neutral' | 'negative' | 'mixed' => {
    const positive = ['good', 'great', 'excellent', 'strong', 'effective', 'compelling'];
    const negative = ['weak', 'poor', 'needs improvement', 'lacking', 'unclear'];

    const positiveCount = positive.reduce((count, word) =>
      count + (text.toLowerCase().includes(word) ? 1 : 0), 0
    );

    const negativeCount = negative.reduce((count, word) =>
      count + (text.toLowerCase().includes(word) ? 1 : 0), 0
    );

    if (positiveCount > negativeCount * 1.5) return 'positive';
    if (negativeCount > positiveCount * 1.5) return 'negative';
    if (positiveCount > 0 && negativeCount > 0) return 'mixed';
    return 'neutral';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 6) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  useEffect(() => {
    if (content && content.split(' ').length > 50) {
      // Auto-analyze if there's substantial content
      analyzeStory();
    }
  }, [content]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Story Analyzer</h3>
            <Badge variant="secondary">{genre}</Badge>
          </div>
          <Button
            onClick={analyzeStory}
            disabled={isAnalyzing || !content.trim()}
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze Story
              </>
            )}
          </Button>
        </div>
      </div>

      {!analysis && !isAnalyzing && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h4 className="font-medium mb-2">Ready to Analyze</h4>
              <p className="text-sm text-muted-foreground">
                Click "Analyze Story" to get AI-powered insights about your writing
              </p>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4 space-y-4">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Word Count</span>
                  </div>
                  <div className="text-2xl font-bold">{analysis.wordCount.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Reading Time</span>
                  </div>
                  <div className="text-2xl font-bold">{analysis.readingTime} min</div>
                </CardContent>
              </Card>
            </div>

            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Overall Score</span>
                  <Badge variant={analysis.overallScore >= 8 ? 'default' : analysis.overallScore >= 6 ? 'secondary' : 'destructive'}>
                    {analysis.overallScore}/10
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={analysis.overallScore * 10} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  Story sentiment: <Badge variant="outline">{analysis.sentiment}</Badge>
                </p>
              </CardContent>
            </Card>

            {/* Quick Scores */}
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Pacing', score: analysis.pacing.score },
                { label: 'Characters', score: analysis.characterDevelopment.score },
                { label: 'Dialogue', score: analysis.dialogue.score },
                { label: 'Plot', score: analysis.plot.score },
                { label: 'Style', score: analysis.style.score },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center space-x-2">
                    {getScoreIcon(item.score)}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(item.score)}`}>
                    {item.score}/10
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="p-4 space-y-4">
            {[
              { key: 'pacing', label: 'Pacing', icon: Clock, data: analysis.pacing },
              { key: 'characters', label: 'Character Development', icon: Users, data: analysis.characterDevelopment },
              { key: 'dialogue', label: 'Dialogue', icon: MessageSquare, data: analysis.dialogue },
              { key: 'plot', label: 'Plot Structure', icon: BookOpen, data: analysis.plot },
              { key: 'style', label: 'Writing Style', icon: Sparkles, data: analysis.style },
            ].map((aspect) => (
              <Card key={aspect.key}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <aspect.icon className="h-5 w-5" />
                    <span>{aspect.label}</span>
                    <Badge variant={aspect.data.score >= 8 ? 'default' : aspect.data.score >= 6 ? 'secondary' : 'destructive'}>
                      {aspect.data.score}/10
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={aspect.data.score * 10} className="mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {aspect.data.feedback}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="suggestions" className="p-4 space-y-4">
            {[
              { label: 'Pacing Improvements', suggestions: analysis.pacing.suggestions },
              { label: 'Character Development', suggestions: analysis.characterDevelopment.suggestions },
              { label: 'Dialogue Enhancement', suggestions: analysis.dialogue.suggestions },
              { label: 'Plot Refinement', suggestions: analysis.plot.suggestions },
              { label: 'Style Polishing', suggestions: analysis.style.suggestions },
            ].map((section) => (
              <Card key={section.label}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};