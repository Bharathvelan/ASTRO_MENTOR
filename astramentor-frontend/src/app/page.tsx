import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Hero, Features, HowItWorks, Footer } from '@/components/landing';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-electric-purple to-teal rounded-lg" />
            <span className="text-xl font-bold">AstraMentor</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="sm:size-default">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="sm:size-default">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* How It Works Section */}
      <HowItWorks />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold">
            Start Learning Smarter Today
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Join developers who are accelerating their learning with AI-powered guidance
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-12 h-14">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
