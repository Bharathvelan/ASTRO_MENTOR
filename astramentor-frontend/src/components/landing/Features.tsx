'use client';

import { Brain, Code2, Network, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: Brain,
    title: 'AI Tutoring',
    description: 'Learn through Socratic dialogue with multi-agent AI tutors that adapt to your skill level and learning style.',
    color: 'from-purple-500 to-electric-purple',
  },
  {
    icon: Code2,
    title: 'Code Analysis',
    description: 'Understand complex codebases with AI-powered explanations, inline hints, and contextual guidance.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Network,
    title: 'Knowledge Graph',
    description: 'Visualize code relationships and dependencies in an interactive graph to understand system architecture.',
    color: 'from-teal to-green-500',
  },
  {
    icon: CheckCircle2,
    title: 'Test Verification',
    description: 'Verify your code with automated tests and get instant feedback on correctness and code quality.',
    color: 'from-green-500 to-emerald-500',
  },
];

/**
 * Features - Landing page features section
 * 
 * Displays 4 feature cards with icons and descriptions.
 * Grid layout: 2x2 on desktop, 1 column on mobile.
 * 
 * Requirements: 12.3, 19.2
 */
export function Features() {
  return (
    <section id="features" className="container mx-auto px-4 py-20 md:py-32">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Learn
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to accelerate your coding journey
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group p-8 hover:shadow-2xl hover:shadow-electric-purple/10 transition-all duration-500 hover:-translate-y-2 border border-border/50 relative overflow-hidden bg-background/60 backdrop-blur-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="relative space-y-4 z-10">
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
