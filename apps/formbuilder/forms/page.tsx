
'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  getAllForms,
  deleteForm,
} from '@/lib/firebaseService/forms';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  MoreVertical,
  Loader2,
  Edit,
  BarChart2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {formatDistanceToNow} from 'date-fns';
import {toast} from '@/hooks/use-toast';
import type {Form} from '@/types/forms';

export default function FormsDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);

  const {
    data: forms,
    isLoading,
    isError,
  } = useQuery<Form[]>({
    queryKey: ['forms'],
    queryFn: getAllForms,
  });

  const deleteMutation = useMutation({
    mutationFn: (formId: string) => {
        if(!formToDelete?.serviceId) throw new Error("Service ID not found");
        return deleteForm(formToDelete.serviceId, formId, []);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['forms']});
      toast({
        title: 'Success',
        description: 'Form deleted successfully.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete the form.',
      });
    },
  });

  const handleDeleteClick = (form: Form) => {
    setFormToDelete(form);
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = () => {
    if (formToDelete && formToDelete.id) {
      deleteMutation.mutate(formToDelete.id);
    }
    setShowDeleteAlert(false);
    setFormToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">Failed to load forms.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Forms</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {forms?.map(form => (
          <Card key={form.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="pr-2 text-lg font-semibold">
                  {form.name}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/apps/formbuilder/forms/${form.id}/edit?serviceId=${form.serviceId}`)
                      }
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(form)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="line-clamp-2">
                {form.description}
              </CardDescription>
            </CardHeader>
             <CardContent>
             </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Last updated{' '}
                {form.updatedAt
                  ? formatDistanceToNow(new Date(form.updatedAt), {
                      addSuffix: true,
                    })
                  : 'never'}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              form and all of its responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
