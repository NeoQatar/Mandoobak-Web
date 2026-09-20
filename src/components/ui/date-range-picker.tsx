
'use client';

import * as React from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from './scroll-area';

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  onDateChange: (dateRange: DateRange | undefined) => void;
}


export function DateRangePicker({
  className,
  onDateChange,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = React.useState(false);
  const [preset, setPreset] = React.useState<string | undefined>(undefined);
  const isMobile = useIsMobile();

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const now = new Date();
    let newDate: DateRange | undefined;
    switch (value) {
        case 'today':
            newDate = { from: now, to: now };
            break;
        case 'yesterday':
            const yesterday = subDays(now, 1);
            newDate = { from: yesterday, to: yesterday };
            break;
        case 'this-week':
            newDate = { from: startOfWeek(now, { weekStartsOn: 1 }), to: now };
            break;
        case 'last-7-days':
            newDate = { from: subDays(now, 6), to: now };
            break;
        case 'last-week':
            const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
            const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });
            newDate = { from: lastWeekStart, to: lastWeekEnd };
            break;
        case 'last-14-days':
            newDate = { from: subDays(now, 13), to: now };
            break;
        case 'this-month':
            newDate = { from: startOfMonth(now), to: now };
            break;
        case 'last-30-days':
            newDate = { from: subDays(now, 29), to: now };
            break;
        case 'last-month':
            const lastMonthStart = startOfMonth(subMonths(now, 1));
            const lastMonthEnd = endOfMonth(subMonths(now, 1));
            newDate = { from: lastMonthStart, to: lastMonthEnd };
            break;
        case 'all-time':
            newDate = undefined;
            break;
        default:
            newDate = undefined;
    }
    setDate(newDate);
  };
  
  const handleApply = () => {
    onDateChange(date);
    setIsOpen(false);
  }

  const handleClear = () => {
    setDate(undefined);
    setPreset(undefined);
    onDateChange(undefined);
  }

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
    if(selectedDate) {
        setPreset('custom');
    } else {
        setPreset(undefined);
    }
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'dd-MM-yyyy')} -{' '}
                  {format(date.to, 'dd-MM-yyyy')}
                </>
              ) : (
                format(date.from, 'dd-MM-yyyy')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col md:flex-row" align="end">
          <div className="flex flex-col border-b md:border-b-0 md:border-r p-4">
             <Collapsible open={isMobile ? isPresetsOpen : true} onOpenChange={isMobile ? setIsPresetsOpen : undefined}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="md:pointer-events-none w-full justify-between px-2">
                        <h4 className='font-medium text-sm'>Custom</h4>
                        {isMobile && (isPresetsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <ScrollArea className="h-[300px]">
                        <div className="flex flex-col space-y-2 mt-2">
                            <Button variant={preset === 'today' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handlePresetChange('today')}>Today</Button>
                            <Button variant={preset === 'yesterday' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handlePresetChange('yesterday')}>Yesterday</Button>
                            <Button variant={preset === 'this-week' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handlePresetChange('this-week')}>This week (Mon - Today)</Button>
                            <Button variant={preset === 'last-7-days' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handlePresetChange('last-7-days')}>Last 7 days</Button>
                            <Button variant={preset === 'last-week' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handlePresetChange('last-week')}>Last week (Mon - Sun)</Button>
                            <Button variant={preset === 'last-14-days' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handlePresetChange('last-14-days')}>Last 14 days</Button>
                            <Button variant={preset === 'this-month' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handlePresetChange('this-month')}>This month</Button>
                            <Button variant={preset === 'last-30-days' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handlePresetChange('last-30-days')}>Last 30 days</Button>
                            <Button variant={preset === 'last-month' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handlePresetChange('last-month')}>Last month</Button>
                            <Button variant={!preset || preset === 'all-time' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handlePresetChange('all-time')}>All Time</Button>
                        </div>
                    </ScrollArea>
                </CollapsibleContent>
             </Collapsible>
          </div>
          <div className="flex flex-col p-4">
            <div className="flex items-center space-x-4 mb-4">
                <div>
                    <label className="text-sm font-medium">Start Date*</label>
                    <Input 
                        type="text" 
                        value={date?.from ? format(date.from, 'dd-MM-yyyy') : ''}
                        readOnly
                        className="bg-gray-100 mt-1"
                    />
                </div>
                 <div>
                    <label className="text-sm font-medium">End Date*</label>
                    <Input 
                        type="text" 
                        value={date?.to ? format(date.to, 'dd-MM-yyyy') : ''}
                        readOnly
                        className="bg-gray-100 mt-1"
                    />
                </div>
            </div>
            <div className='flex justify-center'>
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleDateSelect}
                    numberOfMonths={isMobile ? 1 : 2}
                    captionLayout="dropdown-buttons"
                    fromYear={2010}
                    toYear={new Date().getFullYear()}
                />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
                <Button variant="ghost" onClick={handleClear}>Clear</Button>
                <Button onClick={handleApply} style={{backgroundColor: '#52002d', color: 'white'}}>Apply</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
