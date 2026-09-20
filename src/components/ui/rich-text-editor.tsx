
'use client';
import React, { forwardRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-quill to ensure it's only client-side
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

import 'react-quill/dist/quill.snow.css';
import type { ReactQuillProps } from 'react-quill';

interface RichTextEditorProps extends ReactQuillProps {}

const RichTextEditor = forwardRef<any, RichTextEditorProps>((props, ref) => {
  const modules = {
    toolbar: [
      [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
      [{size: []}],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, 
       {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  return (
    <div className="bg-white">
      <ReactQuill
        ref={ref}
        theme="snow"
        modules={modules}
        formats={formats}
        {...props}
      />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
