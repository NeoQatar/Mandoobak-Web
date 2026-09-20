"use client";

import React from 'react';
import * as icons from 'lucide-react';

type IconName = keyof typeof icons;

interface DynamicIconProps extends React.HTMLAttributes<SVGElement> {
  iconName: string;
}

export const DynamicIcon = ({ iconName, ...props }: DynamicIconProps) => {
  const LucideIcon = icons[iconName as IconName];

  if (!LucideIcon) {
    return <icons.HelpCircle {...props} />; // Fallback icon
  }

  return <LucideIcon {...props} />;
};
