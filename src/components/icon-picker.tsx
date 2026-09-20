"use client";

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { icons } from 'lucide-react';
import { DynamicIcon } from './dynamic-icon';

type IconPickerProps = {
  value?: string;
  onChange: (iconName: string) => void;
};

const iconNames = Object.keys(icons);

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = iconNames.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-12 h-10 p-0">
          <DynamicIcon iconName={value || 'Smile'} className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <h4 className="font-medium leading-none">Select Icon</h4>
          <Input
            placeholder="Search icons..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <ScrollArea className="h-48">
            <div className="grid grid-cols-6 gap-2 p-1">
              {filteredIcons.map(iconName => (
                <Button
                  key={iconName}
                  variant="ghost"
                  size="icon"
                  className={value === iconName ? 'bg-accent' : ''}
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                >
                  <DynamicIcon iconName={iconName} className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
