'use client'

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, ArrowRight } from 'lucide-react';

export function RecordWidget() {
  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Mic className="h-5 w-5 text-red-500" />
        <h3 className="text-lg font-semibold">Quick Record</h3>
      </div>

      <div className="space-y-4">
        {/* Description */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-full">
              <Mic className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Start a quick recording session with advanced multi-track capabilities and real-time collaboration tools.
          </p>
        </div>

        {/* Go to Studio Button */}
        <div className="flex justify-center pt-2 pb-4">
          <Link href="/studio">
            <Button className="w-full" size="lg">
              Go to Studio
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}