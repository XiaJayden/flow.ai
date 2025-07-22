'use client'

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ChevronDown, X } from 'lucide-react';
import { INSTRUMENTS, getInstrumentWithEmoji, generateInstrumentParts } from '@/lib/constants';

interface InstrumentSelectorProps {
  selectedInstruments: string[];
  instrumentParts: Record<string, number>;
  onInstrumentToggle: (instrument: string) => void;
  onInstrumentPartsChange: (instrument: string, count: number) => void;
  onCustomInstrumentAdd: (instrument: string) => void;
  availableInstruments?: string[];
  showPreview?: boolean;
}

export function InstrumentSelector({
  selectedInstruments,
  instrumentParts,
  onInstrumentToggle,
  onInstrumentPartsChange,
  onCustomInstrumentAdd,
  availableInstruments = [],
  showPreview = true
}: InstrumentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInstrument, setCustomInstrument] = useState('');
  
  // Always show the full catalog
  const allInstruments = INSTRUMENTS;
  
  const handleCustomAdd = () => {
    if (customInstrument.trim() && !selectedInstruments.includes(customInstrument.trim())) {
      onCustomInstrumentAdd(customInstrument.trim());
      setCustomInstrument('');
    }
  };

  const getFinalInstruments = (): string[] => {
    const finalInstruments: string[] = [];
    selectedInstruments.forEach(instrument => {
      const parts = instrumentParts[instrument] || 1;
      finalInstruments.push(...generateInstrumentParts(instrument, parts));
    });
    return finalInstruments;
  };

  const removeInstrument = (instrument: string) => {
    onInstrumentToggle(instrument);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>Add Instruments</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Tabs defaultValue="catalog" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="catalog">Catalog</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
              
              <TabsContent value="catalog" className="p-4 space-y-3">
                <div className="text-sm font-medium">Select from catalog:</div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {allInstruments.map(instrument => (
                    <Button
                      key={instrument}
                      variant={selectedInstruments.includes(instrument) ? 'default' : 'outline'}
                      className="w-full justify-start h-auto p-3"
                      onClick={() => {
                        onInstrumentToggle(instrument);
                        setIsOpen(false);
                      }}
                    >
                      <span className="text-left">
                        {getInstrumentWithEmoji(instrument)}
                      </span>
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="p-4 space-y-3">
                <div className="text-sm font-medium">Add custom instrument:</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter instrument name"
                    value={customInstrument}
                    onChange={(e) => setCustomInstrument(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCustomAdd();
                        setIsOpen(false);
                      }
                    }}
                  />
                  <Button 
                    onClick={() => {
                      handleCustomAdd();
                      setIsOpen(false);
                    }}
                    disabled={!customInstrument.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Instruments */}
      {selectedInstruments.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium">Selected instruments:</div>
          <div className="flex flex-wrap gap-2">
            {selectedInstruments.map(instrument => (
              <Badge
                key={instrument}
                variant="default"
                className="pl-2 pr-1 py-1 flex items-center gap-1"
              >
                <span>{getInstrumentWithEmoji(instrument)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeInstrument(instrument)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Instrument Parts Selection */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="text-sm font-medium">Multiple parts:</div>
              {selectedInstruments.map(instrument => (
                <div key={instrument} className="flex items-center justify-between">
                  <span className="text-sm">{getInstrumentWithEmoji(instrument)}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(count => (
                      <Button
                        key={count}
                        size="sm"
                        variant={(instrumentParts[instrument] || 1) === count ? 'default' : 'outline'}
                        className="h-6 w-8 text-xs"
                        onClick={() => onInstrumentPartsChange(instrument, count)}
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}