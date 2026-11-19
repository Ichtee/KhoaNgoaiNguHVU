// One editor configuration, shared by the admin editor and scripts/roundtrip.mjs (which proves that opening
// and saving a post never changes what readers see). Posts stay Markdown: tiptap-markdown reads and writes it.
import StarterKit from '@tiptap/starter-kit';
import HardBreak from '@tiptap/extension-hard-break';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from 'tiptap-markdown';

// Markdown has two line breaks and existing posts use both: a plain newline inside a paragraph ("soft", shown as a
// break by the public site's `white-space: pre-line`) and an explicit one ("  \n" or "\\\n", rendered as <br>).
// The editor keeps which one each break was, so saving an old post writes it back the same way.
// New breaks typed with Shift+Enter are soft, like everything imported.
const LineBreak = HardBreak.extend({
  addAttributes() {
    return {
      soft: { default: true, parseHTML: (el) => el.hasAttribute('data-soft'), renderHTML: () => ({}) }
    };
  },
  addStorage() {
    return {
      markdown: {
        serialize(state, node, parent, index) {
          // a break at the very end of a paragraph means nothing in Markdown; drop it like the default does
          for (let i = index + 1; i < parent.childCount; i++) {
            if (parent.child(i).type !== node.type) {
              // a "## heading" must stay on one line; a soft break in a heading renders as a space anyway
              if (parent.type.name === 'heading') state.write(' ');
              else state.write(node.attrs.soft ? '\n' : '\\\n');
              return;
            }
          }
        },
        parse: {
          setup(markdownit) {
            // mark soft breaks so they come back as soft; explicit ones keep markdown-it's plain <br>
            markdownit.renderer.rules.softbreak = (tokens, idx, options) => (options.breaks ? '<br data-soft>\n' : '\n');
          }
        }
      }
    };
  }
});

export function editorExtensions({ placeholder = '' } = {}) {
  return [
    StarterKit.configure({ link: { openOnClick: false, autolink: true }, hardBreak: false }),
    LineBreak,
    // inline, as Markdown has it: a photo sits in its own paragraph, and a caption line can follow it in the same one
    Image.configure({ inline: true }),
    TableKit,
    Placeholder.configure({ placeholder }),
    Markdown.configure({ html: false, tightLists: true, linkify: false, breaks: true, transformPastedText: true })
  ];
}

export const fromMarkdown = (md) => md || '';
export const toMarkdown = (editor) => editor.storage.markdown.getMarkdown();
