import { PlusOutlined } from '@ant-design/icons';
import { ProForm, ProFormItemProps } from '@ant-design/pro-components';
import { GetProp, Image, Upload, UploadFile, UploadProps } from 'antd';
import React, { useState } from 'react';

export type ImageUploaderProps = {
  value?: string;
  onChange?: (value: string) => void;
};

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const ImageUploader: React.FC<ImageUploaderProps> = (props) => {
  const [previewImage, setPreviewImage] = useState<string | undefined>(props.value ?? '');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  if ((props.value ?? '') !== previewImage) {
    setPreviewImage(props.value ?? '');

    if (props.value === null || props.value === undefined || props.value === '') {
      setFileList([]);
    } else {
      setFileList([
        {
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: props.value,
        },
      ]);
    }
  }

  if (previewImage && fileList.length === 0) {
    setFileList([
      {
        uid: '-1',
        name: 'image.png',
        status: 'done',
        url: previewImage,
      },
    ]);
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as any);
    }

    // 兼容后端返回 { data: { url: string } } 或 { data: [url] }
    if (file.response) {
      const resp: any = file.response;
      let uploadedUrl: string | undefined;
      if (resp?.data) {
        if (Array.isArray(resp.data)) {
          uploadedUrl = resp.data[0];
        } else if (typeof resp.data.url === 'string') {
          uploadedUrl = resp.data.url;
        }
      }
      if (!uploadedUrl && typeof resp?.url === 'string') {
        uploadedUrl = resp.url;
      }

      if (uploadedUrl) {
        file.url = uploadedUrl;
        if (props.onChange) {
          props.onChange(uploadedUrl);
        }
      } else {
        setPreviewImage(file.url || file.preview);
      }
    } else {
      setPreviewImage(file.url || file.preview);
    }

    setPreviewOpen(true);
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);

    if (props.onChange) {
      if (newFileList.length > 0) {
        const f = newFileList[0];
        if (f.response) {
          const resp: any = f.response;
          let uploadedUrl: string | undefined;
          if (resp?.data) {
            if (Array.isArray(resp.data)) {
              uploadedUrl = resp.data[0];
            } else if (typeof resp.data.url === 'string') {
              uploadedUrl = resp.data.url;
            }
          }
          if (!uploadedUrl && typeof resp?.url === 'string') {
            uploadedUrl = resp.url;
          }
          if (uploadedUrl) {
            props.onChange(uploadedUrl);
          }
        }
      } else {
        props.onChange('');
      }
    }
  };

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>点击上传</div>
    </button>
  );

  return (
    <>
      <Upload
        name="file"
        listType="picture-card"
        className="avatar-uploader"
        maxCount={1}
        fileList={fileList}
        customRequest={({ file, onSuccess, onError }) => {
          const formData = new FormData();
          formData.append('file', file as any);

          fetch('/api/file', {
            method: 'POST',
            body: formData,
          })
            .then(async (res) => {
              const json = await res.json().catch(() => ({}));

              const data = {url: [json.data.url]}
              if (!res.ok || (json && typeof json.code !== 'undefined' && json.code !== 0)) {
                const msg = (json && (json.errMessage || json.message)) || '上传失败';
                throw new Error(msg);
              }
              // @ts-ignore
              props.onChange && props.onChange(data.url[0])
              onSuccess && onSuccess(data, file as any);
            })
            .catch((err) => {
              onError && onError(err as any);
            });
        }}
        onPreview={handlePreview}
        onChange={handleChange}
      >
        {fileList.length >= 1 || previewImage ? null : uploadButton}
      </Upload>
      {previewImage && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => {
              if (!visible) {
                setPreviewImage('');
                if (props.onChange) {
                  props.onChange('');
                }
              }
            },
          }}
          src={previewImage}
        />
      )}
    </>
  );
};

export type ProFormImageUploaderProps = ProFormItemProps & Partial<ImageUploaderProps>;

export const ProFormImageUploader: React.FC<ProFormImageUploaderProps> = (props) => {
  return (
    <ProForm.Item name={props.name} label={props.label} tooltip={props.tooltip}>
      <ImageUploader />
    </ProForm.Item>
  );
};

export default ImageUploader;
