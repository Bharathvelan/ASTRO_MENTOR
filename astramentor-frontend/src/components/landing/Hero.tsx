'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * Hero - Landing page hero section
 * 
 * Displays headline, subheadline, and primary/secondary CTAs.
 * Uses brand colors: electric purple and teal.
 * 
 * Requirements: 12.1, 12.2, 12.6
 */
export function Hero() {
  return (
    <section className="relative container mx-auto px-4 py-20 md:py-32 overflow-hidden">
      {/* Decorative Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-electric-purple/15 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal/15 rounded-full blur-[120px] -z-10 animate-pulse delay-1000 pointer-events-none" />
      
      <div className="relative max-w-5xl mx-auto text-center space-y-8 z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-electric-purple/10 border border-electric-purple/20 hover:bg-electric-purple/20 hover:scale-105 transition-all cursor-default shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <Sparkles className="h-4 w-4 text-electric-purple" />
          <span className="text-sm font-medium text-electric-purple">AI-Powered Socratic Learning</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
          Learn to Code with{' '}
          <span className="bg-gradient-to-r from-electric-purple to-teal bg-clip-text text-transparent">
            AI-Powered
          </span>
          <br />
          Socratic Tutoring
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Master programming through guided discovery. Get personalized explanations,
          explore code relationships, and verify your solutions with intelligent AI tutors.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 h-14 group">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="text-lg px-8 h-14">
              Learn More
            </Button>
          </Link>
        </div>

        {/* Social Proof */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-purple to-teal border-2 border-background"
                />
              ))}
            </div>
            <span>Trusted by developers worldwide</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <span>4.9/5 average rating</span>
          </div>
        </div>
      </div>
    </section>
  );
}
