
// src/components/blog/rich-text-editor.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import type { ForwardedRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Image as ImageIconLucide, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Palette, Baseline, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export interface RichTextEditorRef {
  insertImageNode: (src: string, altText?: string, targetRange?: Range) => void;
  focusEditor: () => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const blockFormatDisplayMap: Record<string, string> = {
  p: "Paragraph",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
};

const fontSizes = [
  { label: "Tiny", value: "1" },
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "4" },
  { label: "Extra Large", value: "5" },
  { label: "Huge", value: "6" },
  { label: "Maximum", value: "7" },
];

const RichTextEditor = React.forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, placeholder, className }, ref: ForwardedRef<RichTextEditorRef>) => {
    const localEditorRef = useRef<HTMLDivElement>(null);
    const imageFileInputRef = useRef<HTMLInputElement>(null);
    const [isClient, setIsClient] = React.useState(false);
    const { toast } = useToast();

    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isUl, setIsUl] = useState(false);
    const [isOl, setIsOl] = useState(false);
    const [isAlignLeft, setIsAlignLeft] = useState(true);
    const [isAlignCenter, setIsAlignCenter] = useState(false);
    const [isAlignRight, setIsAlignRight] = useState(false);
    const [isAlignJustify, setIsAlignJustify] = useState(false);
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [currentBlockFormat, setCurrentBlockFormat] = useState('p');
    const [currentFontSize, setCurrentFontSize] = useState('3');
    const [savedRange, setSavedRange] = useState<Range | null>(null);

    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [currentSelectionRangeForLink, setCurrentSelectionRangeForLink] = useState<Range | null>(null);

    useEffect(() => {
      setIsClient(true);
    }, []);

    const saveSelection = useCallback(() => {
      if (!isClient || !localEditorRef.current) return;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && localEditorRef.current.contains(selection.anchorNode)) {
        setSavedRange(selection.getRangeAt(0).cloneRange());
      } else {
        setSavedRange(null);
      }
    }, [isClient]);
    
    const restoreSelectionAndFocus = useCallback(() => {
      if (!isClient || !localEditorRef.current) return;
      localEditorRef.current.focus();
      if (savedRange) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(savedRange);
        }
      }
      setSavedRange(null); 
    }, [isClient, savedRange]);

    const getSelectionBlockFormat = useCallback((): string => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return 'p';
    
      let node = selection.anchorNode;
    
      if (!node || !localEditorRef.current?.contains(node)) {
        if(localEditorRef.current === document.activeElement && localEditorRef.current.innerHTML === "") return 'p';
        return 'p'; 
      }
    
      while (node && node !== localEditorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toLowerCase();
    
          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tagName)) {
            return tagName;
          }
    
          if (tagName === 'li' || tagName === 'blockquote') {
            const firstChildElement = Array.from(element.children).find(child => child instanceof HTMLElement) as HTMLElement | undefined;
            if (firstChildElement && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(firstChildElement.tagName.toLowerCase())) {
              return firstChildElement.tagName.toLowerCase();
            }
            return 'p'; 
          }
        }
        node = node.parentNode;
      }
      
      const editorFirstChild = localEditorRef.current?.firstChild;
      if (editorFirstChild && editorFirstChild.nodeType === Node.ELEMENT_NODE) {
          const firstChildTagName = (editorFirstChild as HTMLElement).tagName.toLowerCase();
          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(firstChildTagName)) {
              return firstChildTagName;
          }
      }
    
      return 'p'; 
    }, []);


    const updateToolbarStates = useCallback(() => {
      const currentEditor = localEditorRef.current;
      if (!isClient || !document.queryCommandSupported || !currentEditor) {
        setIsBold(false); setIsItalic(false); setIsUnderline(false);
        setIsAlignLeft(true); setIsAlignCenter(false); setIsAlignRight(false); setIsAlignJustify(false);
        setCurrentBlockFormat('p');
        setCurrentFontSize('3');
        setIsUl(false); setIsOl(false);
        return;
      }
      try {
          setIsBold(document.queryCommandState('bold'));
          setIsItalic(document.queryCommandState('italic'));
          setIsUnderline(document.queryCommandState('underline'));
          setIsUl(document.queryCommandState('insertUnorderedList'));
          setIsOl(document.queryCommandState('insertOrderedList'));

          const newBlockFmt = getSelectionBlockFormat();
          setCurrentBlockFormat(newBlockFmt);
          
          const rawFontSize = document.queryCommandValue('fontSize');
          if (rawFontSize && /^[1-7]$/.test(rawFontSize)) {
            setCurrentFontSize(rawFontSize);
          } else {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              let parent = selection.getRangeAt(0).commonAncestorContainer;
              while(parent && parent !== currentEditor) {
                if (parent.nodeName === "FONT" && (parent as HTMLElement).hasAttribute("size")) {
                  const sizeAttr = (parent as HTMLElement).getAttribute("size");
                  if (sizeAttr && /^[1-7]$/.test(sizeAttr)) {
                    setCurrentFontSize(sizeAttr);
                    break;
                  }
                }
                parent = parent.parentNode;
              }
              if (parent === currentEditor || !parent) { 
                 setCurrentFontSize('3');
              }
            } else {
              setCurrentFontSize('3'); 
            }
          }

          const isCenter = document.queryCommandState('justifyCenter');
          const isRight = document.queryCommandState('justifyRight');
          const isFull = document.queryCommandState('justifyFull');
          setIsAlignCenter(isCenter);
          setIsAlignRight(isRight);
          setIsAlignJustify(isFull);
          setIsAlignLeft(!isCenter && !isRight && !isFull);

      } catch (e) {
          console.warn("RTE: Error querying command state:", e);
          setIsBold(false); setIsItalic(false); setIsUnderline(false);
          setIsUl(false); setIsOl(false);
          setIsAlignLeft(true); setIsAlignCenter(false); setIsAlignRight(false); setIsAlignJustify(false);
          setCurrentBlockFormat('p');
          setCurrentFontSize('3');
      }
    }, [isClient, getSelectionBlockFormat]);

    useEffect(() => {
      if (isClient && localEditorRef.current && localEditorRef.current.innerHTML !== value) {
        const selection = window.getSelection();
        let savedRangeLocal: Range | null = null;
        if (selection && selection.rangeCount > 0 && localEditorRef.current?.contains(selection.anchorNode)) {
            savedRangeLocal = selection.getRangeAt(0).cloneRange();
        }

        localEditorRef.current.innerHTML = value;

        if (savedRangeLocal && selection && localEditorRef.current?.contains(savedRangeLocal.startContainer) && localEditorRef.current?.contains(savedRangeLocal.endContainer)) {
            try {
                selection.removeAllRanges();
                selection.addRange(savedRangeLocal);
            } catch (e) {
                console.warn("RTE: Error restoring selection after innerHTML update:", e);
                 if (localEditorRef.current) {
                    const newRange = document.createRange();
                    newRange.selectNodeContents(localEditorRef.current);
                    newRange.collapse(false); 
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
            }
        }
      }
    }, [value, isClient]);

    const handleEditorFocus = useCallback(() => {
        setIsEditorFocused(true);
        updateToolbarStates();
    }, [updateToolbarStates]);

    const handleEditorBlur = useCallback(() => {
      setTimeout(() => {
        if (localEditorRef.current &&
            !localEditorRef.current.contains(document.activeElement) &&
            !document.querySelector('[data-slot="toolbar"]')?.contains(document.activeElement) &&
            !document.querySelector('[data-radix-popper-content-wrapper]')?.contains(document.activeElement) &&
            !document.querySelector('[role="dialog"]')?.contains(document.activeElement)
           ) {
          setIsEditorFocused(false);
        }
      }, 100); 
    }, []);


    const _insertImageNode = useCallback((src: string, altText: string = "User inserted image", targetRange?: Range) => {
      const currentEditor = localEditorRef.current;
      if (!currentEditor) return;

      currentEditor.focus(); 

      const img = document.createElement('img');
      img.src = src;
      img.alt = altText;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block"; 
      if (altText.toLowerCase().startsWith("ai generated image")) {
        img.dataset.aiHint = "illustration abstract"; 
      }

      let currentAlignment = 'left'; 
      if (document.queryCommandState('justifyCenter')) {
          currentAlignment = 'center';
      } else if (document.queryCommandState('justifyRight')) {
          currentAlignment = 'right';
      }
      
      if (currentAlignment === 'center') {
        img.style.marginLeft = "auto";
        img.style.marginRight = "auto";
      } else if (currentAlignment === 'right') {
        img.style.marginLeft = "auto";
        img.style.marginRight = "0";
      } else { 
        img.style.marginLeft = "0";
        img.style.marginRight = "auto"; 
      }

      const pWrapper = document.createElement('p');
      pWrapper.style.textAlign = currentAlignment; 
      pWrapper.appendChild(img);


      const selection = window.getSelection();
      let range: Range | undefined = targetRange || savedRange; 

      if (!range) {
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
        } else {
          currentEditor.appendChild(pWrapper);
          const pAfter = document.createElement('p');
          pAfter.innerHTML = '&#8203;'; 
          currentEditor.appendChild(pAfter);

          if (selection) {
              const newRange = document.createRange();
              newRange.setStart(pAfter, 0); 
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
          }
          onChange(currentEditor.innerHTML);
          updateToolbarStates();
          return;
        }
      }

      range.deleteContents(); 
      range.insertNode(pWrapper); 

      const pAfter = document.createElement('p');
      pAfter.innerHTML = '&#8203;'; 

      if (pWrapper.parentNode) { 
        if (pWrapper.nextSibling) {
          pWrapper.parentNode.insertBefore(pAfter, pWrapper.nextSibling);
        } else {
          pWrapper.parentNode.appendChild(pAfter);
        }
        if (selection) {
          const newRange = document.createRange();
          newRange.setStart(pAfter, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        currentEditor.appendChild(pAfter);
      }

      onChange(currentEditor.innerHTML);
      updateToolbarStates();
      setSavedRange(null); 
    }, [onChange, updateToolbarStates, savedRange]);


    useImperativeHandle(ref, () => ({
      insertImageNode: (src: string, altText: string = "User inserted image", targetRange?: Range) => {
        _insertImageNode(src, altText, targetRange);
      },
      focusEditor: () => {
        localEditorRef.current?.focus();
      }
    }));

    useEffect(() => {
      const currentEditorNode = localEditorRef.current;
      if (!isClient || !currentEditorNode) return;

      const handleSelectionChange = () => {
        if (currentEditorNode.contains(document.activeElement) || 
            document.activeElement === currentEditorNode || 
            document.querySelector('[data-slot="toolbar"]')?.contains(document.activeElement) ||
            document.querySelector('[data-radix-popper-content-wrapper]')?.contains(document.activeElement) ||
            document.querySelector('[role="dialog"]')?.contains(document.activeElement)
            ) {
          updateToolbarStates();
        }
      };

      document.addEventListener('selectionchange', handleSelectionChange);
      currentEditorNode.addEventListener('focus', handleEditorFocus);
      currentEditorNode.addEventListener('blur', handleEditorBlur);
      currentEditorNode.addEventListener('keyup', updateToolbarStates);
      currentEditorNode.addEventListener('mouseup', updateToolbarStates);

      if (document.activeElement === currentEditorNode) {
          updateToolbarStates();
          setIsEditorFocused(true); 
      }

      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
        currentEditorNode.removeEventListener('focus', handleEditorFocus);
        currentEditorNode.removeEventListener('blur', handleEditorBlur);
        currentEditorNode.removeEventListener('keyup', updateToolbarStates);
        currentEditorNode.removeEventListener('mouseup', updateToolbarStates);
      };
    }, [isClient, updateToolbarStates, handleEditorFocus, handleEditorBlur]);


    const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
      onChange(event.currentTarget.innerHTML);
    };

    const execCommand = (command: string, valueArg?: string) => {
      if (isClient && localEditorRef.current) {
        document.execCommand(command, false, valueArg);
        if (localEditorRef.current) onChange(localEditorRef.current.innerHTML); 
        updateToolbarStates(); 
      }
    };
    
    const handleBlockFormatChange = (newFormat: string) => {
        if (isClient && localEditorRef.current) {
            restoreSelectionAndFocus(); 
            document.execCommand('formatBlock', false, newFormat);
            if (localEditorRef.current) {
                 onChange(localEditorRef.current.innerHTML);
            }
            setCurrentBlockFormat(newFormat); 
            setTimeout(() => { 
                updateToolbarStates();
                 restoreSelectionAndFocus(); 
            }, 0); 
        }
    };
    
    const handleFontSizeChange = (newSize: string) => {
      if (isClient && localEditorRef.current) {
        restoreSelectionAndFocus();
        document.execCommand('fontSize', false, newSize);
        setCurrentFontSize(newSize); 
        if (localEditorRef.current) onChange(localEditorRef.current.innerHTML);
        setTimeout(() => {
          updateToolbarStates();
          restoreSelectionAndFocus();
        }, 0);
      }
    };


    const handleImageUploadFromButton = () => {
      if (isClient && localEditorRef.current && imageFileInputRef.current) {
          saveSelection(); 
          imageFileInputRef.current.click();
      }
    };

    const handleImageFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          if (localEditorRef.current) {
            const selection = window.getSelection();
            if (selection) {
                if (savedRange) { 
                    selection.removeAllRanges();
                    selection.addRange(savedRange);
                } else if (document.activeElement !== localEditorRef.current) {
                    localEditorRef.current.focus();
                    const range = document.createRange();
                    range.selectNodeContents(localEditorRef.current);
                    range.collapse(false); 
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
             const finalRangeToInsert = window.getSelection()?.rangeCount ?? 0 > 0 ? window.getSelection()?.getRangeAt(0) : undefined;
            _insertImageNode(dataUrl, file.name, finalRangeToInsert);
          }
        };
        reader.readAsDataURL(file);
      } else if (file) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (e.g., PNG, JPG, GIF).",
          variant: "destructive",
        });
      }
      if(event.target) {
        event.target.value = ""; 
      }
      setSavedRange(null); 
    };

    const openLinkDialog = () => {
      if (!localEditorRef.current) return;
      saveSelection(); 
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        setCurrentSelectionRangeForLink(selection.getRangeAt(0).cloneRange());
        const selectedText = selection.toString();
        setLinkText(selectedText);

        let parentNode = selection.anchorNode;
        if (parentNode && parentNode.nodeType === Node.TEXT_NODE) {
          parentNode = parentNode.parentNode;
        }
        if (parentNode && parentNode instanceof HTMLAnchorElement) {
          setLinkUrl(parentNode.href);
        } else {
          setLinkUrl('https://'); 
        }
      } else {
        setCurrentSelectionRangeForLink(null); 
        setLinkText('');
        setLinkUrl('https://');
      }
      setIsLinkDialogOpen(true);
    };

    const handleInsertLink = () => {
      if (!localEditorRef.current) return;
    
      restoreSelectionAndFocus(); 
      const selection = window.getSelection(); 
    
      if (currentSelectionRangeForLink && selection) { 
        selection.removeAllRanges();
        selection.addRange(currentSelectionRangeForLink); 
    
        if (currentSelectionRangeForLink.collapsed && linkText) {
          const link = document.createElement('a');
          link.href = linkUrl;
          link.textContent = linkText || linkUrl; 
          link.target = "_blank";
          link.rel = "noopener noreferrer"; 
    
          currentSelectionRangeForLink.insertNode(link);
    
          const newRange = document.createRange();
          newRange.setStartAfter(link);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
    
        } else if (!currentSelectionRangeForLink.collapsed) {
           document.execCommand('createLink', false, linkUrl);
           const tempDiv = document.createElement('div');
           tempDiv.appendChild(currentSelectionRangeForLink.cloneContents());
           tempDiv.querySelectorAll('a').forEach(linkNode => {
               linkNode.target = "_blank";
               linkNode.rel = "noopener noreferrer";
           });
            const justCreatedLinks = Array.from(localEditorRef.current.querySelectorAll('a')).filter(
              a => a.getAttribute('href') === linkUrl && !a.hasAttribute('target')
            );
            justCreatedLinks.forEach(linkElement => {
              linkElement.target = "_blank";
              linkElement.rel = "noopener noreferrer";
            });

        } else { 
          const linkHTML = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`;
          document.execCommand('insertHTML', false, linkHTML);
        }
    
      } else if (linkText) { 
          const linkHTML = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
          document.execCommand('insertHTML', false, linkHTML);
      } else { 
          const linkHTML = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`;
          document.execCommand('insertHTML', false, linkHTML);
      }
    
      if (localEditorRef.current) onChange(localEditorRef.current.innerHTML);
      updateToolbarStates();
      setIsLinkDialogOpen(false);
      setLinkUrl(''); 
      setLinkText('');
      setCurrentSelectionRangeForLink(null);
      setSavedRange(null); 
    };


    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const color = event.target.value;
      if (isClient && localEditorRef.current) {
        restoreSelectionAndFocus();
        document.execCommand('foreColor', false, color);
        if (localEditorRef.current) onChange(localEditorRef.current.innerHTML); // Ensure editor's innerHTML is captured
        updateToolbarStates(); 
        restoreSelectionAndFocus(); // Restore focus after execCommand
      }
    };

    if (!isClient) {
      return (
        <div
          className={cn(
            "border border-input rounded-md bg-muted min-h-[248px] p-3 flex items-center justify-center",
            className
          )}
        >
          <p>Loading editor...</p>
        </div>
      );
    }
    
    return (
      <div className={cn("border border-input rounded-md shadow-sm bg-card flex flex-col", className)}>
        <input
          type="file"
          ref={imageFileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleImageFileSelected}
        />
        <div
          data-slot="toolbar" 
          className="sticky top-0 z-10 flex flex-wrap items-center gap-1 p-2 border-b border-input rounded-t-md bg-muted" 
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            onClick={() => { execCommand('bold'); restoreSelectionAndFocus(); }}
            title="Bold (Ctrl+B)"
            aria-pressed={isBold}
            className={cn("hover:bg-accent", {"bg-primary text-primary-foreground hover:bg-primary/90": isBold})}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            onClick={() => { execCommand('italic'); restoreSelectionAndFocus(); }}
            title="Italic (Ctrl+I)"
            aria-pressed={isItalic}
            className={cn("hover:bg-accent", {"bg-primary text-primary-foreground hover:bg-primary/90": isItalic})}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            onClick={() => { execCommand('underline'); restoreSelectionAndFocus(); }}
            title="Underline (Ctrl+U)"
            aria-pressed={isUnderline}
            className={cn("hover:bg-accent", {"bg-primary text-primary-foreground hover:bg-primary/90": isUnderline})}
          >
            <Underline className="h-4 w-4" />
          </Button>

          <div
            className="relative flex items-center justify-center w-10 h-10 rounded-md hover:bg-accent hover:text-accent-foreground group" 
            title="Text Color"
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
          >
            <Palette className="h-4 w-4 pointer-events-none text-foreground group-hover:text-accent-foreground" />
            <input
              type="color"
              aria-label="Text Color"
              onChange={handleColorChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 px-2 py-1 text-xs w-auto min-w-[120px] justify-start data-[state=open]:bg-accent" 
                onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
                title="Block Format"
              >
                <Baseline className="h-4 w-4 mr-2" />
                <span className="truncate">{blockFormatDisplayMap[currentBlockFormat] || "Paragraph"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value={currentBlockFormat} onValueChange={handleBlockFormatChange}>
                <DropdownMenuRadioItem value="p">Paragraph</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="h1">Heading 1</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="h2">Heading 2</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="h3">Heading 3</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="h4">Heading 4</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="h5">Heading 5</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="h6">Heading 6</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 px-2 py-1 text-xs w-auto min-w-[110px] justify-start data-[state=open]:bg-accent"
                onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
                title="Font Size"
              >
                 <Baseline className="h-4 w-4 mr-1" /> 
                <span className="truncate">
                  Size: {fontSizes.find(fs => fs.value === currentFontSize)?.label || "Normal"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value={currentFontSize} onValueChange={handleFontSizeChange}>
                {fontSizes.map(size => (
                  <DropdownMenuRadioItem key={size.value} value={size.value}>
                    {size.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
          <Button
            type="button" variant="ghost" size="icon" 
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            onClick={() => { execCommand('insertUnorderedList'); restoreSelectionAndFocus(); }} title="Bullet List" aria-pressed={isUl}
            className={cn("hover:bg-accent", {"bg-primary text-primary-foreground hover:bg-primary/90": isUl})}
          ><List className="h-4 w-4" /></Button>
          <Button
            type="button" variant="ghost" size="icon" 
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            onClick={() => { execCommand('insertOrderedList'); restoreSelectionAndFocus(); }} title="Numbered List" aria-pressed={isOl}
            className={cn("hover:bg-accent", {"bg-primary text-primary-foreground hover:bg-primary/90": isOl})}
          ><ListOrdered className="h-4 w-4" /></Button>

          <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
          <Button
            type="button" variant="ghost" size="icon" 
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            onClick={() => { execCommand('justifyLeft'); restoreSelectionAndFocus(); }} title="Align Left" aria-pressed={isAlignLeft}
            className={cn("hover:bg-accent", {"bg-primary text-primary-foreground hover:bg-primary/90": isAlignLeft})}
          ><AlignLeft className="h-4 w-4" /></Button>
          <Button
            type="button" variant="ghost" size="icon" 
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            onClick={() => { execCommand('justifyCenter'); restoreSelectionAndFocus(); }} title="Align Center" aria-pressed={isAlignCenter}
            className={cn("hover:bg-accent", {"bg-primary text-primary-foreground hover:bg-primary/90": isAlignCenter})}
          ><AlignCenter className="h-4 w-4" /></Button>
          <Button
            type="button" variant="ghost" size="icon" 
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            onClick={() => { execCommand('justifyRight'); restoreSelectionAndFocus(); }} title="Align Right" aria-pressed={isAlignRight}
            className={cn("hover:bg-accent", {"bg-primary text-primary-foreground hover:bg-primary/90": isAlignRight})}
          ><AlignRight className="h-4 w-4" /></Button>
          <Button
            type="button" variant="ghost" size="icon" 
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
            onClick={() => { execCommand('justifyFull'); restoreSelectionAndFocus(); }} title="Justify (mobile shows as left align)" aria-pressed={isAlignJustify}
            className={cn("hover:bg-accent", {"bg-primary text-primary-foreground hover:bg-primary/90": isAlignJustify})}
          ><AlignJustify className="h-4 w-4" /></Button>

          <Separator orientation="vertical" className="h-6 mx-1 bg-border" />
          <Button
              type="button" variant="ghost" size="icon" 
              onMouseDown={(e) => { e.preventDefault(); openLinkDialog(); }} 
              title="Insert Link" className="hover:bg-accent"
          ><LinkIcon className="h-4 w-4" /></Button>
          <Button
            type="button" variant="ghost" size="icon" 
            onMouseDown={(e) => { e.preventDefault(); handleImageUploadFromButton(); }} 
            title="Insert Image from File"
            disabled={!isEditorFocused} 
            className="hover:bg-accent"
          ><ImageIconLucide className="h-4 w-4" /></Button>
        </div>
        <div
          ref={localEditorRef}
          contentEditable
          onInput={handleInput}
          data-placeholder={placeholder || "Write your blog post here..."}
          className={cn(
              "prose prose-lg max-w-none p-3 flex-1 max-h-[min(50vh,480px)] overflow-y-auto min-h-[200px] focus:outline-none focus:ring-1 focus:ring-ring rounded-b-md bg-background text-foreground",
              "[&[contenteditable]]:empty:before:content-[attr(data-placeholder)] [&[contenteditable]]:empty:before:text-muted-foreground [&[contenteditable]]:empty:before:opacity-50",
              "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2",
              "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2",
              "[&_li]:my-1",
              "prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline",
              "text-left", 
               "[&_h1]:text-4xl [&_h1]:font-extrabold",
               "[&_h2]:text-3xl [&_h2]:font-bold",
               "[&_h3]:text-2xl [&_h3]:font-bold",
               "[&_h4]:text-xl [&_h4]:font-semibold",
               "[&_h5]:text-lg [&_h5]:font-semibold",
               "[&_h6]:text-base [&_h6]:font-semibold"
          )}
          style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }} 
          onFocus={handleEditorFocus} 
          onBlur={handleEditorBlur} 
        />
        <Dialog open={isLinkDialogOpen} onOpenChange={(open) => {
          setIsLinkDialogOpen(open);
          if (!open) { 
            restoreSelectionAndFocus();
            setCurrentSelectionRangeForLink(null); 
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="linkText">Display Text</Label>
                <Input
                  id="linkText"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Text to display"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkUrl">URL</Label>
                <Input
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                 setIsLinkDialogOpen(false); 
                 restoreSelectionAndFocus();
                 setCurrentSelectionRangeForLink(null);
              }}>Cancel</Button>
              <Button onClick={handleInsertLink}>Insert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);
RichTextEditor.displayName = 'RichTextEditor';
export default RichTextEditor;
