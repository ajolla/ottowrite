import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Mail, MessageCircle, Book } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Support Center</h1>
          <p className="text-xl text-muted-foreground">
            Get help with Ottowrite and find answers to common questions
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <HelpCircle className="h-8 w-8 text-primary mb-2" />
              <CardTitle>FAQ</CardTitle>
              <CardDescription>
                Find answers to frequently asked questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View FAQ
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageCircle className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Live Chat</CardTitle>
              <CardDescription>
                Chat with our support team in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Mail className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Email Support</CardTitle>
              <CardDescription>
                Send us an email and we'll get back to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:support@ottowrite.com">
                  Send Email
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted/30 rounded-lg p-8">
          <div className="text-center mb-8">
            <Book className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Getting Started</h2>
            <p className="text-muted-foreground">
              New to Ottowrite? Check out our quick start guide
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Quick Start Guide</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Learn the basics of using Ottowrite in 5 minutes
              </p>
              <Button variant="outline" size="sm">
                Read Guide
              </Button>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Video Tutorials</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Watch step-by-step video tutorials
              </p>
              <Button variant="outline" size="sm">
                Watch Videos
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for?
          </p>
          <Link href="/">
            <Button variant="ghost">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}