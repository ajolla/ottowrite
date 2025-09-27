"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, FileText, Zap, Users } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const Home = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8" />
            <span className="text-2xl font-bold">Ottowrite</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/editor">
              <Button>Try Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Write with AI.
            <br />
            <span className="text-muted-foreground">Create brilliantly.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
            Ottowrite is the AI-powered writing assistant that helps creative writers
            break through blocks, enhance their prose, and bring their stories to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/editor">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Writing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Supercharge Your Writing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful AI tools designed specifically for creative writers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-lg border border-border bg-background">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-4">AI Continue</h3>
              <p className="text-muted-foreground">
                Never face a blank page again. Our AI seamlessly continues your story
                in your unique voice and style.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-lg border border-border bg-background">
              <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-4">Smart Rewrite</h3>
              <p className="text-muted-foreground">
                Enhance your prose with intelligent suggestions for tone, style,
                and clarity without losing your voice.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-lg border border-border bg-background">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-4">Character & Plot</h3>
              <p className="text-muted-foreground">
                Brainstorm characters, plot twists, and story elements with AI
                that understands narrative structure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to write your masterpiece?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of writers using Ottowrite to craft their best work.
          </p>
          <Link href="/editor">
            <Button size="lg" className="text-lg px-12 py-6">
              Start Writing Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t border-border py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <FileText className="h-6 w-6" />
              <span className="text-xl font-bold">Ottowrite</span>
            </div>
            <div className="flex space-x-8 text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
            </div>
          </div>
          <div className="text-center text-muted-foreground text-sm mt-8">
            © 2024 Ottowrite. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;