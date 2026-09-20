'use client';

import {useRouter} from 'next/navigation';
import {useMutation} from '@tanstack/react-query';
import {addForm} from '@/lib/firebaseService/forms';
import {toast} from '@/hooks/use-toast';
import {useEffect} from 'react';

export default function NewFormPage() {
  const router = useRouter();

   useEffect(() => {
    toast({
        variant: 'destructive',
        title: 'Action Disabled',
        description: 'Please create new services to create new forms.',
      });
    router.push('/apps/formbuilder/forms');
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
