import '@wangeditor/editor/dist/css/style.css';

import React, { useState, useEffect, RefAttributes } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';

type EditorComponentProps = {
  style?: React.CSSProperties;
  value?: string;
  onChange?: (value: string) => void;
};

export type EditorAction = {
  getValue: () => string;
  setValue: (content: string) => void;
};

type InsertFnType = (url: string, alt: string, href: string) => void;
type InsertVideoFnType = (url: string, poster: string) => void;

const EditorComponent: React.FC<EditorComponentProps & RefAttributes<EditorAction>> = React.memo(
  ({ style, value, onChange }) => {
    // editor 实例
    const [editor, setEditor] = useState<IDomEditor | null>(null);

    // 工具栏配置
    const toolbarConfig: Partial<IToolbarConfig> = {};

    // 编辑器配置
    const editorConfig: Partial<IEditorConfig> = {
      maxLength: 1000,
      placeholder: '请输入内容...',
      MENU_CONF: {
        uploadImage: {
          server: '/api/file',
          fieldName: 'file',
          maxFileSize: 10 * 1024 * 1024, // 10M
          customInsert(res: any, insertFn: InsertFnType) {
            insertFn(res.data.url, '', res.data[0]);
          },
        },
        uploadVideo: {
          server: '/api/file',
          fieldName: 'file',
          maxFileSize: 10 * 1024 * 1024, // 10M
          customInsert(res: any, insertFn: InsertVideoFnType) {
            insertFn(res.data.url, '');
          },
        },
      },
    };

    useEffect(() => {
      return () => {
        if (editor === null) return;
        editor.destroy();
        setEditor(null);
      };
    }, [editor]);

    return (
      <>
        <div style={{ border: '1px solid #ccc', zIndex: 100 }}>
          <Toolbar
            editor={editor}
            defaultConfig={toolbarConfig}
            mode="default"
            style={{ borderBottom: '1px solid #ccc' }}
          />
          <Editor
            defaultConfig={editorConfig}
            value={value}
            onCreated={setEditor}
            onChange={(editor) => onChange && onChange(editor.getHtml())}
            mode="default"
            style={style ?? { height: '500px', overflowY: 'hidden' }}
          />
        </div>
      </>
    );
  },
);

export default EditorComponent;
