
'use client';

import { useState, useEffect } from 'react';
import { Slider, createSlider, updateSlider, deleteSlider, getSliders, updateSlidersOrder } from '@/lib/sliders';
import { useTranslatedData } from '@/hooks/use-translated-data';
import { storage } from '@/lib/firebase';
import * as firebaseStorage from 'firebase/storage';
// @ts-ignore
const { ref, uploadBytes, getDownloadURL, deleteObject } = firebaseStorage;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, Loader2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTableRowProps {
  slider: Slider;
  onEdit: (slider: Slider) => void;
  onDelete: (slider: Slider) => void;
}

function SortableTableRow({ slider, onEdit, onDelete }: SortableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slider.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[50px]">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-primary">
          <GripVertical className="h-4 w-4" />
        </div>
      </TableCell>
      <TableCell>
        {slider.imageUrl && (
          <img
            src={slider.imageUrl}
            alt={slider.title}
            className="h-12 w-20 object-cover rounded"
          />
        )}
      </TableCell>
      <TableCell className="font-medium">{slider.title}</TableCell>
      <TableCell>{slider.description}</TableCell>
      <TableCell>
        <Badge variant={slider.status === 'Active' ? 'default' : 'secondary'}>
          {slider.status || 'Active'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(slider)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(slider)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function SlidersManager() {
  const [slidersRaw, setSliders] = useState<Slider[]>([]);
  const sliders = useTranslatedData(slidersRaw);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSlider, setCurrentSlider] = useState<Partial<Slider>>({
    title: '',
    description: '',
    sortOrder: 0,
    imageUrl: '',
    status: 'Active',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSliders((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update sortOrder based on index
        const updatedItems = newItems.map((item: Slider, index: number) => ({
          ...item,
          sortOrder: index
        }));

        // Fire and forget (or handle error)
        updateSlidersOrder(updatedItems.map((i: Slider) => ({ id: i.id!, sortOrder: i.sortOrder })))
          .catch(() => {
            toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
            fetchSliders();
          });

        return updatedItems;
      });
    }
  };

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const data = await getSliders();
      setSliders(data);
    } catch (error) {
      console.error("Error fetching sliders:", error);
      toast({
        title: 'Error',
        description: 'Failed to fetch sliders.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentSlider((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = currentSlider.imageUrl;

      if (imageFile) {
        // Upload new image
        const storageRef = ref(storage, `sliders/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);

        // Delete old image if it exists and is a storage URL (and we are replacing it)
        if (isEditing && currentSlider.id) {
           const oldSlider = sliders.find(s => s.id === currentSlider.id);
           if (oldSlider?.imageUrl && oldSlider.imageUrl.includes('firebasestorage')) {
             try {
               const oldImageRef = ref(storage, oldSlider.imageUrl);
               await deleteObject(oldImageRef);
             } catch (err) {
               console.error("Failed to delete old image:", err);
             }
           }
        }
      }

      if (isEditing && currentSlider.id) {
        await updateSlider(currentSlider.id, {
          title: currentSlider.title ?? '',
          description: currentSlider.description ?? '',
          imageUrl: imageUrl,
          status: currentSlider.status || 'Active',
        });
        toast({ title: 'Success', description: 'Slider updated successfully.' });
      } else {
        await createSlider({
          title: currentSlider.title ?? '',
          description: currentSlider.description ?? '',
          sortOrder: sliders.length,
          imageUrl: imageUrl!,
          status: currentSlider.status as 'Active' | 'Inactive',
        });
        toast({ title: 'Success', description: 'Slider created successfully.' });
      }
      setIsDialogOpen(false);
      fetchSliders();
      resetForm();
    } catch (error) {
      console.error("Error saving slider:", error);
      toast({
        title: 'Error',
        description: 'Failed to save slider.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slider: Slider) => {
    if (confirm('Are you sure you want to delete this slider?')) {
      try {
        if (slider.imageUrl && slider.imageUrl.includes('firebasestorage')) {
          try {
            const imageRef = ref(storage, slider.imageUrl);
            await deleteObject(imageRef);
          } catch (error) {
            console.error("Failed to delete image from storage:", error);
          }
        }
        await deleteSlider(slider.id!);
        toast({ title: 'Success', description: 'Slider deleted successfully.' });
        fetchSliders();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete slider.',
          variant: 'destructive',
        });
      }
    }
  };

  const openEditDialog = (slider: Slider) => {
    setCurrentSlider(slider);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentSlider({
      title: '',
      description: '',
      sortOrder: 0,
      imageUrl: '',
      status: 'Active',
    });
    setImageFile(null);
    setIsEditing(false);
  };

  const draggableSliders = sliders.filter(s => !!s.id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Sliders List</h2>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Slider
        </Button>
      </div>

      <div className="border rounded-md">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-muted-foreground text-sm font-medium animate-pulse">Loading sliders...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sliders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    No sliders found.
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={sliders.map(s => s.id!)}
                  strategy={verticalListSortingStrategy}
                >
                  {sliders.map((slider) => (
                    <SortableTableRow
                      key={slider.id}
                      slider={slider}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Slider' : 'Add New Slider'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the details of the slider.' : 'Fill in the details to create a new slider.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={currentSlider.title ?? ''}
                onChange={(e) => setCurrentSlider({ ...currentSlider, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={currentSlider.description ?? ''}
                onChange={(e) => setCurrentSlider({ ...currentSlider, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={currentSlider.status || 'Active'}
                onValueChange={(value) => setCurrentSlider({ ...currentSlider, status: value as 'Active' | 'Inactive' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <div className="flex flex-col gap-2">
                {currentSlider.imageUrl && (
                  <img src={currentSlider.imageUrl} alt="Preview" className="h-32 object-contain border rounded p-1 bg-muted" />
                )}
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required={!isEditing && !currentSlider.imageUrl}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
