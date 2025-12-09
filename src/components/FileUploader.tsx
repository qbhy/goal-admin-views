import {PlusOutlined} from '@ant-design/icons';
import {ProForm, ProFormItemProps} from '@ant-design/pro-components';
import {Upload, UploadFile, UploadProps} from 'antd';
import React, {useEffect, useMemo, useState} from 'react';

export type FileUploaderProps = {
  value?: string;
  onChange?: (value: string) => void;
  maxCount?: number;
  buttonText?: string;
};

// 解析后端可能的响应结构，提取文件 URL
function extractUploadedUrl(resp: any): string | undefined {
  if (!resp) return undefined;
  // 常见后端响应：{ code: 0, data: { url: string } }
  if (resp?.data) {
    if (Array.isArray(resp.data)) {
      const first = resp.data[0];
      if (typeof first === 'string') return first;
      if (first?.url && typeof first.url === 'string') return first.url;
    } else if (typeof resp.data.url === 'string') {
      return resp.data.url;
    }
  }
  // 兼容 { url: string }
  if (typeof resp?.url === 'string') return resp.url;
  return undefined;
}

const FileUploader: React.FC<FileUploaderProps> = (props) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const maxCount = useMemo(() => props.maxCount ?? 5, [props.maxCount]);
  const buttonText = useMemo(() => props.buttonText ?? '点击上传文件', [props.buttonText]);

  // 将外部值映射为 UploadFile 列表
  useEffect(() => {
    const mapped: UploadFile[] = (props.value ? [props.value] : []).map((url, idx) => ({
      uid: String(idx + 1),
      name: url.split('/').filter(Boolean).pop() || `file-${idx + 1}`,
      status: 'done',
      url,
    }));
    setFileList(mapped);
  }, [props.value]);

  const handleChange: UploadProps['onChange'] = ({fileList: newFileList}) => {
    setFileList(newFileList);
    if (props.onChange) {
      const urls: string[] = [];
      newFileList.forEach((f) => {
        // 优先使用上传响应中的 URL
        const uploadedUrl = extractUploadedUrl((f as any).response);
        if (uploadedUrl) {
          urls.push(uploadedUrl);
          return;
        }
        if (typeof f.url === 'string' && f.url.length > 0) {
          urls.push(f.url);
        }
      });
      props.onChange(urls[0]);
    }
  };

  const uploadButton = (
    <button style={{border: 0, background: 'none'}} type="button">
      <PlusOutlined/>
      <div style={{marginTop: 8}}>{buttonText}</div>
    </button>
  );

  return (
    <>
      <Upload
        name="file"
        multiple
        onRemove={(file) => {
          setFileList([])
        }}
        listType="text"
        maxCount={maxCount}
        fileList={fileList}
        showUploadList={{showRemoveIcon: true, showPreviewIcon: false}}
        customRequest={({file, onSuccess, onError}) => {
          const formData = new FormData();
          formData.append('file', file as any);

          fetch('/api/file', {
            method: 'POST',
            body: formData,
          })
            .then(async (res) => {
              const json = await res.json().catch(() => ({}));
              if (!res.ok || (json && typeof json.code !== 'undefined' && json.code !== 0)) {
                const msg = (json && (json.errMessage || json.message)) || '上传失败';
                throw new Error(msg);
              }
              // 统一 onSuccess 响应格式，后续在 onChange 中解析
              const data = {url: json?.data?.url ? json.data.url : undefined};

              props.onChange && props.onChange(data.url);
              onSuccess && onSuccess(data as any, file as any);
            })

            .catch((err) => {
              onError && onError(err as any);
            });
        }}
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </Upload>
    </>
  );
};

export type ProFormFileUploaderProps = ProFormItemProps & Partial<FileUploaderProps>;

export const ProFormFileUploader: React.FC<ProFormFileUploaderProps> = (props) => {
  return (
    <ProForm.Item name={props.name} label={props.label} tooltip={props.tooltip}>
      <FileUploader maxCount={props.maxCount} buttonText={props.buttonText}/>
    </ProForm.Item>
  );
};

export default FileUploader;
