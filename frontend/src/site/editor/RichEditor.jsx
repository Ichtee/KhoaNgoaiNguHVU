import React, { useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import {
  Bold, Code2, Columns3, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Redo2, Rows3, Star, Table, Trash2, Undo2
} from 'lucide-react';
import { api } from '../../api';
import { editorExtensions, fromMarkdown, toMarkdown } from './extensions';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const imageFiles = (list) => [...(list || [])].filter((f) => f.type.startsWith('image/'));

// `text` is the short word shown next to the icon, so nobody has to guess what a symbol means
function Tool({ label, text, on, onClick, disabled, children }) {
  return (
    <button type="button" className={on ? 'on' : ''} aria-label={label} title={label} aria-pressed={on === undefined ? undefined : on}
      disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {children}<span className="tool-text">{text || label}</span>
    </button>
  );
}

// The post body, edited the way it will look. It reads and writes Markdown (see extensions.js),
// so the stored post and the public site do not change. Loaded only by the admin (React.lazy).
export default function RichEditor({ value, onChange, alt = '', onError, onCover, allowSource = false, placeholder = 'Viết nội dung bài…' }) {
  const [raw, setRaw] = useState(false); // the "Sửa mã Markdown" view
  const [busy, setBusy] = useState(false);
  const picker = useRef(null);
  const live = useRef(null); // the editor, for the paste/drop handlers created before it exists

  // uploads in order; the ones that worked are inserted even if a later one fails, each in its own paragraph
  const insertImages = async (files, ed) => {
    if (!files.length) return;
    setBusy(true);
    let failed = '';
    for (const file of files) {
      try {
        const { url } = await api.upload(file);
        ed.chain().focus().insertContent({ type: 'paragraph', content: [{ type: 'image', attrs: { src: url, alt } }] }).run();
      } catch (err) {
        failed = failed || err.message;
      }
    }
    setBusy(false);
    if (failed) onError?.(failed);
    else onError?.('');
  };

  const editor = useEditor({
    extensions: editorExtensions({ placeholder }),
    content: fromMarkdown(value),
    onUpdate: ({ editor: ed }) => onChange(toMarkdown(ed)),
    editorProps: {
      attributes: { class: 'prose rte-content', 'aria-label': 'Nội dung bài viết', role: 'textbox', 'aria-multiline': 'true' },
      handlePaste: (view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (!files.length) return false;
        insertImages(files, live.current);
        return true;
      },
      handleDrop: (view, event, slice, moved) => {
        const files = moved ? [] : imageFiles(event.dataTransfer?.files);
        if (!files.length) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (pos) live.current.commands.setTextSelection(pos.pos);
        insertImages(files, live.current);
        return true;
      }
    }
  });
  live.current = editor;

  const s = useEditorState({
    editor,
    selector: ({ editor: ed }) => (ed ? {
      bold: ed.isActive('bold'),
      italic: ed.isActive('italic'),
      h2: ed.isActive('heading', { level: 2 }),
      h3: ed.isActive('heading', { level: 3 }),
      bullet: ed.isActive('bulletList'),
      ordered: ed.isActive('orderedList'),
      quote: ed.isActive('blockquote'),
      link: ed.isActive('link'),
      image: ed.isActive('image'),
      imageSrc: ed.isActive('image') ? ed.getAttributes('image').src : '',
      table: ed.isActive('table'),
      undo: ed.can().undo(),
      redo: ed.can().redo()
    } : {})
  });

  if (!editor) return null;
  const run = (fn) => () => fn(editor.chain().focus()).run();

  const setLink = () => {
    const current = editor.getAttributes('link').href || '';
    const href = window.prompt('Địa chỉ liên kết (để trống để bỏ liên kết):', current);
    if (href === null) return;
    const clean = href.trim();
    if (!clean) return editor.chain().focus().extendMarkRange('link').unsetLink().run();
    if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(clean)) return onError?.('Liên kết phải bắt đầu bằng https://, mailto:, tel: hoặc /');
    editor.chain().focus().extendMarkRange('link').setLink({ href: clean }).run();
    onError?.('');
  };

  const toggleRaw = () => {
    if (raw) editor.commands.setContent(fromMarkdown(value), { emitUpdate: false }); // back from Markdown: load what was typed there
    setRaw(!raw);
  };

  return (
    <div className="rte">
      <div className="rte-bar" role="toolbar" aria-label="Định dạng nội dung">
        {!raw && (
          <>
            <Tool label="In đậm" text="Đậm" on={s.bold} onClick={run((c) => c.toggleBold())}><Bold size={18} /></Tool>
            <Tool label="Nghiêng" on={s.italic} onClick={run((c) => c.toggleItalic())}><Italic size={18} /></Tool>
            <Tool label="Tiêu đề" on={s.h2} onClick={run((c) => c.toggleHeading({ level: 2 }))}><Heading2 size={18} /></Tool>
            <Tool label="Tiêu đề nhỏ" text="Tiêu đề nhỏ" on={s.h3} onClick={run((c) => c.toggleHeading({ level: 3 }))}><Heading3 size={18} /></Tool>
            <span className="rte-sep" aria-hidden="true" />
            <Tool label="Danh sách" on={s.bullet} onClick={run((c) => c.toggleBulletList())}><List size={18} /></Tool>
            <Tool label="Danh sách đánh số" text="Đánh số" on={s.ordered} onClick={run((c) => c.toggleOrderedList())}><ListOrdered size={18} /></Tool>
            <Tool label="Trích dẫn" on={s.quote} onClick={run((c) => c.toggleBlockquote())}><Quote size={18} /></Tool>
            <Tool label="Liên kết" on={s.link} onClick={setLink}><Link2 size={18} /></Tool>
            <span className="rte-sep" aria-hidden="true" />
            <Tool label={busy ? 'Đang tải ảnh lên…' : 'Chèn ảnh'} disabled={busy} onClick={() => picker.current?.click()}><ImagePlus size={18} /></Tool>
            <Tool label="Chèn bảng" text="Bảng" onClick={run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))}><Table size={18} /></Tool>
            <span className="rte-sep" aria-hidden="true" />
            <Tool label="Hoàn tác" disabled={!s.undo} onClick={run((c) => c.undo())}><Undo2 size={18} /></Tool>
            <Tool label="Làm lại" disabled={!s.redo} onClick={run((c) => c.redo())}><Redo2 size={18} /></Tool>
          </>
        )}
        {(allowSource || raw) && (
          <button type="button" className="rte-raw" onClick={toggleRaw}>
            <Code2 size={16} aria-hidden="true" /> {raw ? 'Quay lại trình soạn thảo' : 'Sửa mã Markdown'}
          </button>
        )}

        {/* what can be done to the thing under the cursor */}
        {!raw && s.image && (
          <div className="rte-context" role="group" aria-label="Ảnh đang chọn">
            {onCover && s.imageSrc && <button type="button" onClick={() => onCover(s.imageSrc)}><Star size={16} aria-hidden="true" /> Làm ảnh bìa</button>}
            <button type="button" className="danger" onClick={run((c) => c.deleteSelection())}><Trash2 size={16} aria-hidden="true" /> Xóa ảnh</button>
          </div>
        )}
        {!raw && s.table && (
          <div className="rte-context" role="group" aria-label="Bảng">
            <button type="button" onClick={run((c) => c.addRowAfter())}><Rows3 size={16} aria-hidden="true" /> Thêm hàng</button>
            <button type="button" onClick={run((c) => c.addColumnAfter())}><Columns3 size={16} aria-hidden="true" /> Thêm cột</button>
            <button type="button" className="danger" onClick={run((c) => c.deleteTable())}><Trash2 size={16} aria-hidden="true" /> Xóa bảng</button>
          </div>
        )}
      </div>

      <input ref={picker} type="file" multiple accept={IMAGE_TYPES.join(',')} hidden
        onChange={(e) => { const files = [...e.target.files]; e.target.value = ''; insertImages(files, editor); }} />

      {raw ? (
        <textarea className="rte-source" aria-label="Mã Markdown của nội dung" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
