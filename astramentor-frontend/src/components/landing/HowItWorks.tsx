'use client';

import { Upload, MessageSquare, Lightbulb, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Code',
    description: 'Upload your codebase or connect your repository to get started',
    number: 1,
  },
  {
    icon: MessageSquare,
    title: 'Ask Questions',
    description: 'Ask anything about your code or programming concepts',
    number: 2,
  },
  {
    icon: Lightbulb,
    title: 'Learn Interactively',
    description: 'Get guided assistance through Socratic dialogue and progressive hints',
    number: 3,
  },
  {
    icon: CheckCircle,
    title: 'Verify Solutions',
    description: 'Test and verify your code with AI-generated tests and feedback',
    number: 4,
  },
];

/**
 * HowItWorks - Landing page how-it-works section
 * 
 * Displays 3-4 steps showing user journey.
 * Step numbers, titles, descriptions with icons.
 * 
 * Requirements: 12.4
 */
export function HowItWorks() {
  return (
    <section className="container mx-auto px-4 py-20 md:py-32 bg-muted/30 rounded-3xl">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start learning in minutes with our simple 4-step process
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector Line (hidden on mobile, shown on desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-electric-purple/50 to-teal/50" />
                )}

                {/* Step Card */}
                <div className="relative text-center space-y-4">
                  {/* Number Badge */}
                  <div className="relative inline-flex group cursor-default">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-electric-purple to-teal flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] group-hover:scale-110 transition-all duration-500">
                      {step.number}
                    </div>
                    {/* Icon Badge */}
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-background border-4 border-background flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform duration-500">
                      <Icon className="h-6 w-6 text-electric-purple" />
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-4">
            Ready to transform your learning experience?
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 text-electric-purple hover:text-electric-purple/80 font-semibold text-lg"
          >
            Get started now
            <span className="text-2xl">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
