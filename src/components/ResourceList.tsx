import {
  actionResource,
  batchFieldsResource,
  deleteResource,
  exportResources,
  findResource,
  getResourceMeta,
  updateResource,
} from '@/services/resource';
import {getObjectValByPath, handlerListResourceServiceCall, resolveColumns} from '@/utils';
import {
  ActionType,
  BetaSchemaForm,
  ProColumns,
  ProFormInstance,
  ProTable,
  ProTableProps,
  TableDropdown,
} from '@ant-design/pro-components';
import {Button, Descriptions, FormInstance, Image, message, Modal, Spin, Table, Tabs} from 'antd';
import {useAccess} from '@umijs/max';
import React, {
  createElement,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import ResourceEditor from '@/components/ResourceEditor';
import CustomSearchForm from '@/components/CustomSearchForm';
import {produce} from 'immer';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  MenuOutlined,
  PlusOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import {BaseButtonProps} from 'antd/lib/button/button';
import ProValueTypeProvider from "@/components/ProValueTypeProvider";
import './ResourceList.css'; // 引入 CSS 文件来隐藏 ProTable 的展开收起按钮

export type EditorHandler = {
  open: (identity: any) => void;
  copy: (identity: any) => void;
};


export type ResourceAction = {
  name: 'update' | 'delete' | string;
  title?: string;
  icon?: ReactNode;
  text?: string;
  className?: string;
  multiple?: boolean;
  danger?: boolean;
  disabled?:
    | boolean
    | ((id: number | string | (number | string)[], record: any | any[]) => boolean);
  onClick?: (
    id: number | string | (number | string)[],
    record: any | any[],
    instance: {
      editorHandler: EditorHandler;
      action: React.MutableRefObject<ActionType | undefined>;
      resourceName: string;
    },
  ) => void;
};

export type ResourceActionWithMore =
  | (ResourceAction & { children?: ResourceAction[] })
  | 'update'
  | 'delete';

const actionMapper: (
  action: any,
) => ResourceAction & { children?: ResourceAction[] } = (action) => {
  if (action === 'update') {
    return {
      key: action,
      name: 'update',
      icon: <EditOutlined/>,
      multiple: false,
      text: '编辑',
      onClick: (id, _, instance) => {
        console.log('id', id)
        instance.editorHandler.open(id)
      },
    };
  } else if (action === 'delete') {
    return {
      key: action,
      name: 'delete',
      icon: <DeleteOutlined/>,
      multiple: true,
      text: '删除',
      danger: true,
      onClick: async (id, _, instance) => {
        Modal.confirm({
          title: `确定删除${id instanceof Array ? '选中的' : '该'}数据吗？`,
          onOk: async () => {
            if (id instanceof Array) {
              await actionResource(instance.resourceName, 'batch-delete', id, {ids: id});
            } else {
              await deleteResource(instance.resourceName, id);
            }
            instance.action.current?.reload();
          },
        });
      },
    };
  } else if (action === 'copy') {
    return {
      key: action,
      name: 'copy',
      icon: <CopyOutlined/>,
      multiple: true,
      text: '复制',
      onClick: (id, _, instance) => instance.editorHandler.copy(id),
    };
  } else {
    if (action.name === 'update' || action.name === 'delete') {
      return {
        key: action.name,
        ...actionMapper(action.name),
        ...action,
      };
    } else if (action.name === 'more') {
      return {
        key: action.name,
        ...action,
        children: action.children?.map(actionMapper),
      };
    } else {
      return action;
    }
  }
};

export type ResourceListProps = {
  resourceName: string;
  actionRef?: React.Ref<ActionType | undefined>;
  formRef?: React.Ref<FormInstance | undefined>;
  columnMapper?: (column: ProColumns) => ProColumns;
  sort?: Record<string, 'ascend' | 'descend'>;
  sortKey?: string;
  operation?: {
    render?: (
      record: any,
      editorHandler: EditorHandler,
      actions: ReactNode | ReactNode[],
    ) => React.ReactNode;
    width?: number;
  };
  columnEditorMapper?: (
    column: ProColumns,
    idx: number,
    columns: ProColumns[],
  ) => ReactNode | null | false;
  editorProps?: {
    width?: number;
  };
  defaultValues?: Record<string, any>;
  create?:
    | boolean
    | {
    buttonProps: BaseButtonProps;
  };
  actions?: ('delete' | 'update' | 'copy')[] | ResourceActionWithMore[];
  toolbarActions?: ReactNode[];
  params?: any;
  ghost?: boolean;
  actionExtraRender?: (actionName: string, form: React.Ref<FormInstance | undefined>) => any,
  expect?:
    | (string | number | (string | number)[])[]
    | {
    create?: (string | number | (string | number)[])[];
    update?: (string | number | (string | number)[])[];
  };
  select?: boolean;
  proTableProps?: Partial<ProTableProps<any, any>>;
};

const defaultColumnMapper = (column: ProColumns) => {
  if (column.valueType === 'switch') {
    column.render = (_, record) => {
      const val = getObjectValByPath(record, column.dataIndex);
      return (
        <div className="text-center">
          {val ? (
            <CheckCircleOutlined className="text-green-600"/>
          ) : (
            <CloseCircleOutlined className="text-red-600"/>
          )}
        </div>
      );
    };
  }
  return column;
};

// 通用渲染方法：在详情和表格中统一处理 html/url 预览
function commonRender(
  fieldName: string,
  value: any,
  opts?: {
    mode?: 'table' | 'detail';
    column?: ProColumns;
    label?: string;
    normalizeUrl?: (v: string) => string;
    getExt?: (v: string) => string | undefined;
    isImageExt?: (ext?: string) => boolean;
    isVideoExt?: (ext?: string) => boolean;
    isAudioExt?: (ext?: string) => boolean;
    is3DExt?: (ext?: string) => boolean;
    ensureModelViewerLoaded?: () => void;
    instantDownload?: (url: string) => void;
  },
): React.ReactNode {
  const mode = opts?.mode || 'detail';
  const column = opts?.column;
  const label = opts?.label || fieldName;
  const normalizeUrl = opts?.normalizeUrl;
  const getExt = opts?.getExt;
  const isImageExt = opts?.isImageExt;
  const isVideoExt = opts?.isVideoExt;
  const isAudioExt = opts?.isAudioExt;
  const is3DExt = opts?.is3DExt;
  const ensureModelViewerLoaded = opts?.ensureModelViewerLoaded;
  const instantDownload = opts?.instantDownload;

  const endsWithHtml = fieldName.toLowerCase().endsWith('html');
  const endsWithUrl = fieldName.toLowerCase().endsWith('url');
  // 额外的图片字段名判断：avatar/logo/cover 一律按图片预览
  const isAvatarLogoCover = ['avatar', 'logo', 'cover'].includes(fieldName.toLowerCase());

  // 如果列自带渲染器（在详情模式调用时传入 column.render），尊重原有逻辑
  if (mode === 'detail' && typeof column?.render === 'function') {
    try {
      return (column as any).render(value);
    } catch {
    }
  }

  // html 富文本渲染
  if (endsWithHtml) {
    const html = String(value ?? '');
    if (mode === 'table') {
      return (
        <div
          style={{maxWidth: '100%', maxHeight: 120, overflow: 'auto'}}
          dangerouslySetInnerHTML={{__html: html}}
        />
      );
    }
    return <div style={{maxWidth: '100%'}} dangerouslySetInnerHTML={{__html: html}}/>;
  }

  // url 媒体预览；avatar/logo/cover 字段也按图片处理
  if ((endsWithUrl || isAvatarLogoCover) && typeof value === 'string' && String(value).length > 0) {
    const urlStr = normalizeUrl ? normalizeUrl(String(value)) : String(value);
    const ext = getExt ? getExt(urlStr) : undefined;

    // 表格与详情不同的尺寸
    const imageHeight = mode === 'table' ? 48 : 120;
    const viewerHeight = mode === 'table' ? 120 : 360;
    const videoStyle = mode === 'table'
      ? {width: 180, height: 120, borderRadius: 4}
      : {width: '100%', maxHeight: 420, borderRadius: 4};
    const audioStyle = mode === 'table'
      ? {width: 180}
      : {width: '100%'};

    let node: React.ReactNode;
    // 对 avatar/logo/cover 字段强制以图片显示
    if (isAvatarLogoCover) {
      node = (
        <Image
          src={urlStr}
          alt={label}
          height={imageHeight}
          style={{maxWidth: '100%', borderRadius: 4, objectFit: 'contain'}}
          preview={{src: urlStr}}
        />
      );
    } else if (isImageExt && isImageExt(ext)) {
      node = (
        <Image
          src={urlStr}
          alt={label}
          height={imageHeight}
          style={{maxWidth: '100%', borderRadius: 4, objectFit: 'contain'}}
          preview={{src: urlStr}}
        />
      );
    } else if (isVideoExt && isVideoExt(ext)) {
      node = (
        <video src={urlStr} controls style={videoStyle as any}/>
      );
    } else if (isAudioExt && isAudioExt(ext)) {
      node = (
        <audio src={urlStr} controls style={audioStyle as any}/>
      );
    } else if (is3DExt && is3DExt(ext)) {
      // 仅对 glb/gltf 使用 model-viewer，其它类型降级为链接
      if (ext === 'glb' || ext === 'gltf') {
        ensureModelViewerLoaded && ensureModelViewerLoaded();
        node = createElement('model-viewer', {
          src: urlStr,
          style: {width: mode === 'table' ? 180 : '100%', height: viewerHeight},
          'camera-controls': true,
          'auto-rotate': true,
          exposure: "0.9"
        });
      } else {
        node = (
          <a href={urlStr} target="_blank" rel="noopener noreferrer">
            {urlStr}
          </a>
        );
      }
    } else {
      node = (
        <a href={urlStr} target="_blank" rel="noopener noreferrer">
          {urlStr}
        </a>
      );
    }

    if (mode === 'detail') {
      return (
        <div>
          {node}
          <div style={{marginTop: 8}}>
            <Button size="small" onClick={() => instantDownload && instantDownload(urlStr)}>
              立即下载
            </Button>
          </div>
        </div>
      );
    }
    return node;
  }

  // 支持枚举：如果存在 valueEnum，优先使用枚举的文本
  const ve = (column as any)?.valueEnum;
  if (ve) {
    try {
      let mapped: any = undefined;
      if (Array.isArray(ve)) {
        const idxVal = typeof value === 'number' ? value : Number(value);
        mapped = ve[idxVal];
      } else if (typeof ve === 'object') {
        mapped = ve?.[value as any] ?? ve?.[String(value)];
      }
      if (mapped !== undefined && mapped !== null) {
        if (typeof mapped === 'object') {
          return mapped.text ?? mapped.label ?? mapped.title ?? JSON.stringify(mapped);
        }
        return String(mapped);
      }
      return typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    } catch (e) {
      return typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    }
  }

  // 默认文本
  return typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
}

const ResourceList = React.memo<ResourceListProps>(
  ({
     resourceName,
     columnMapper = (column) => column,
     operation,
     columnEditorMapper,
     defaultValues,
     sortKey,
     actionRef,
     formRef: ResourceListFormRef,
     sort = {},
     editorProps,
     params: defaultParams,
     expect,
     select = true,
     ghost,
     proTableProps,
     actionExtraRender,
     toolbarActions: customerToolbarActions = [],
   }) => {
    const [sorting, setSorting] = useState(false);

    const [meta, setMeta] = useState({
      rowKey: 'id',
      columns: [],
      actions: [],
      tableOptions: {},
      copyable: false,
      creatable: true,
      deleteable: true,
      exportable: true,
      name: "users",
      title: "用户管理",
      updatable: true,
    });

    const [editor, setEditor] = useState<{
      open: boolean;
      identity: any;
      copy?: boolean;
    }>({
      open: false,
      identity: undefined,
    });

    const [actions, setActions] = useState<string[]>([]);
    const [actionForm, setActionForm] = useState<{ open: boolean; action?: any, id?: any }>({open: false});
    const [isTableInitialized, setIsTableInitialized] = useState<boolean>(false);

    // @ts-ignore
    const ref = useRef<ActionType>();
    // @ts-ignore
    const formRef = useRef<FormInstance>();
    const [params, setParams] = useState<Record<string, any>>({});
    const [downloadUrl, setDownloadUrl] = useState<string>();
    const [approveMode, setApproveMode] = useState<boolean>(true);
    const [approveReason, setApproveReason] = useState<string>('');
    const [detail, setDetail] = useState<{
      open: boolean;
      identity: any;
      loading: boolean;
      data: any | null;
    }>({open: false, identity: undefined, loading: false, data: null});
    const openDetail = useCallback(async (identity: any) => {
      setDetail({open: true, identity, loading: true, data: null});
      try {
        const item = await findResource(resourceName, identity);
        setDetail((d) => ({...d, loading: false, data: item}));
      } catch (e: any) {
        message.error(e?.message || '获取详情失败');
        setDetail((d) => ({...d, loading: false}));
      }
    }, [resourceName]);
    const fileName = useMemo(() => {
      if (!downloadUrl) return undefined;
      try {
        const u = new URL(downloadUrl);
        const last = u.pathname.split('/').filter(Boolean).pop();
        return last || u.hostname;
      } catch (e) {
        const parts = downloadUrl.split('?')[0].split('#')[0].split('/');
        return parts.filter(Boolean).pop();
      }
    }, [downloadUrl]);

    // 访问控制：需在任何使用之前初始化，避免 TDZ 错误
    const access = useAccess();

    const triggerDownload = useCallback(() => {
      if (!downloadUrl) return;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, [downloadUrl]);

    const copyDownloadUrl = useCallback(async () => {
      if (!downloadUrl) return;
      try {
        await navigator.clipboard.writeText(downloadUrl);
        message.success('下载链接已复制');
      } catch (err) {
        try {
          const input = document.createElement('input');
          input.value = downloadUrl;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
          message.success('下载链接已复制');
        } catch (e) {
          message.error('复制失败，请手动复制');
        }
      }
    }, [downloadUrl]);

    useEffect(() => {
      if (downloadUrl) {
        // 自动触发一次下载，同时保留弹窗供用户再次下载或复制链接
        triggerDownload();
      }
    }, [downloadUrl, triggerDownload]);
    const [loading, setLoading] = useState(false);

    const ensureModelViewerLoaded = useCallback(() => {
      if (typeof document === 'undefined') return;
      const exist = Array.from(document.querySelectorAll('script'))
        .some((s) => (s.src || '').includes('model-viewer'));
      if (!exist) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
        document.head.appendChild(script);
      }
    }, []);

    const instantDownload = useCallback((url: string) => {
      if (!url) return;
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        window.open(url, '_blank');
      }
    }, []);

    const normalizeUrl = useCallback((val: string) => {
      try {
        return new URL(val, window.location.origin).href;
      } catch {
        return val;
      }
    }, []);

    const getFieldName = useCallback((dataIndex: any): string => {
      if (Array.isArray(dataIndex)) {
        const last = dataIndex[dataIndex.length - 1];
        return String(last ?? '');
      }
      return String(dataIndex ?? '');
    }, []);

    const isHttpUrl = (val: any) => {
      if (typeof val !== 'string') return false;
      try {
        const u = new URL(val);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return /^https?:\/\//.test(val);
      }
    };

    const getExt = (val: string): string | undefined => {
      try {
        const u = new URL(val);
        const path = u.pathname;
        const clean = path.split('/').filter(Boolean).pop() || '';
        const ext = clean.split('.').pop();
        return ext?.toLowerCase();
      } catch {
        const clean = val.split('?')[0].split('#')[0];
        const ext = clean.split('.').pop();
        return ext?.toLowerCase();
      }
    };

    const isImageExt = (ext?: string) => !!ext && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif'].includes(ext);
    const isVideoExt = (ext?: string) => !!ext && ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext);
    const isAudioExt = (ext?: string) => !!ext && ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext);
    const is3DExt = (ext?: string) => !!ext && ['glb', 'gltf', 'obj', 'fbx', 'stl', 'dae'].includes(ext);

    useImperativeHandle(actionRef, () => ref.current);
    useImperativeHandle(ResourceListFormRef, () => formRef.current);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [foreignFields, setForeignFields] = useState<{
      [localField: string]: Record<string, any>
    }>({})
    const [foreignKeys, setForeignKeys] = useState<{
      [localField: string]: {
        keyField: string;
        model: string
        labelField: string;
      }
    }>()

    useEffect(() => {
      // 重置初始化状态
      setIsTableInitialized(false);

      getResourceMeta(resourceName).then(async (res) => {
        const tmpMeta = res.data.meta
        const tmpForeignFields: Record<string, any> = {}
        for (const col of tmpMeta.columns) {
          if (col.foreignKey && col.foreignKey.keyField != '') {
            tmpForeignFields[col.dataIndex] = col.foreignKey
          }
        }
        setForeignKeys({...tmpForeignFields})

        setMeta(tmpMeta);
        let a = ['detail']
        if (res.data.meta.creatable) a.push('create')
        if (res.data.meta.copyable) a.push('copy')
        if (res.data.meta.deleteable) a.push('delete')
        if (res.data.meta.updatable) a.push('update')
        setActions(a)
      });
    }, [resourceName]);

    // 确保页面加载时自动加载表格数据
    useEffect(() => {
      if (meta.columns.length > 0 && ref.current && !isTableInitialized) {
        // 延迟一下确保组件完全挂载
        setTimeout(() => {
          ref.current?.reload();
          setIsTableInitialized(true);
        }, 100);
      }
    }, [meta.columns.length, isTableInitialized]);

    // 用于操作按钮的操作
    const editorHandler: EditorHandler = useMemo(
      () => ({
        open: (identity) => {
          setEditor({open: true, identity, copy: false});
        },
        copy: (identity) => {
          setEditor({open: true, identity, copy: true});
        },
      }),
      [resourceName],
    );

    const defaultOperationRender = useCallback(
      (_: any, record: any) => {
        const identity = record[meta.rowKey];
        const ops = actions.map((item, index) => {
          const action: any = actionMapper(item);
          if (action.children && action.children.length > 0) {
            return (
              <TableDropdown
                key={index}
                onSelect={(key) => {
                  const subAction = action.children?.find((subAction: any) => subAction.name === key);
                  if (subAction) {
                    // 只读角色不允许触发写入型子操作
                    const writeOp = ['update', 'delete', 'copy'].includes(String(subAction.name));
                    if (!access.canWrite && writeOp) {
                      message.warning('当前角色不可执行写操作');
                      return;
                    }
                    subAction.onClick?.(identity, record, {
                      editorHandler,
                      action: ref,
                      resourceName,
                    });
                  }
                }}
                menus={action.children.map((subAction: any) => ({
                  key: subAction.name,
                  name: subAction.title || subAction.name,
                  icon: subAction.icon,
                  danger: subAction.danger,
                  disabled:
                    (subAction.disabled instanceof Function
                      ? subAction.disabled(identity, record)
                      : subAction.disabled) || (!access.canWrite && ['update', 'delete', 'copy'].includes(String(subAction.name))),
                }))}
              />
            );
          }
          return (
            <Button
              key={(typeof action === 'string' ? action : action.key) + identity}
              type="link"
              size="small"
              className={action.className}
              disabled={
                (action.disabled instanceof Function
                  ? action.disabled(identity, record)
                  : action.disabled) || (!access.canWrite && ['update', 'delete', 'copy'].includes(String(action.name)))
              }
              danger={action.danger}
              icon={action.icon}
              onClick={() =>
                !(!access.canWrite && ['update', 'delete', 'copy'].includes(String(action.name))) &&
                action.onClick?.(identity, record, {editorHandler, action: ref, resourceName})
              }
            />
          );
        });

        if (meta.actions) {
          ops.push(
            <TableDropdown
              key='后端自定义操作'
              onSelect={(key) => {
                if (!access.canWrite) {
                  message.warning('当前角色不可执行写操作');
                  return;
                }
                setActionForm({
                  open: true,
                  id: identity,
                  action: meta.actions.find((item: any) => item.name === key),
                })
              }}
              menus={meta.actions.filter((item: any) => !item.batch).map((subAction: any) => ({
                key: subAction.name,
                name: subAction.title || subAction.name,
                icon: subAction.icon,
                danger: subAction.danger,
                disabled: !access.canWrite,
              }))}
            />
          )
        }

        // 固定操作：详情（调用 findResource 展示详情弹窗）
        ops.push(
          <Button key={'detail-' + identity} type="link" size="small" onClick={() => openDetail(identity)}>
            详情
          </Button>
        );
        return ops;
      },
      [actions, meta.rowKey, resourceName, openDetail],
    );

    const operationColumns: ProColumns[] =
      operation && operation.render
        ? [
          {
            title: '操作',
            dataIndex: 'operation',
            valueType: 'option',
            fixed: 'right',
            width: operation.width || 120,
            render: (_, record) =>
              operation.render &&
              operation.render(
                record,
                {
                  open: (identity) => {
                    setEditor({open: true, identity, copy: false});
                  },
                  copy: (identity) => {
                    setEditor({open: true, identity, copy: true});
                  },
                },
                defaultOperationRender(_, record),
              ),
          },
        ]
        : actions && actions.length > 0
          ? [
            {
              title: '操作',
              dataIndex: 'operation',
              valueType: 'option',
              fixed: 'right',
              width: operation?.width || 80,
              render: defaultOperationRender,
            },
          ]
          : [];

    const toolbarActions = [
      ...customerToolbarActions,
      ...(meta.actions?.filter((item: any) => item.batch).map((actionItem: any, idx: number) => {
        const title = actionItem?.title || actionItem?.name || `批量操作${idx + 1}`;
        return (
          <Button
            key={`batch-action-${idx}`}
            size="small"
            disabled={((!selectedRowKeys || selectedRowKeys.length === 0) && actionItem.columns?.find((i: any) => i.dataIndex == 'id') != undefined) || !access.canWrite}
            onClick={async () => {
              if (!access.canWrite) {
                message.warning('当前角色不可执行写操作');
                return;
              }
              const ids = selectedRowKeys as (string | number)[];
              // 打开参数填写弹窗（ModalForm），根据 actionItem.columns 动态渲染表单
              setActionForm({open: true, action: actionItem, id: ids && ids.length > 0 ? ids : undefined});
              return;
            }}
          >
            {title}
          </Button>
        );
      }) || []),
    ];


    if (meta.creatable) {
      toolbarActions.push(
        <Button
          key={0}
          type="primary"
          size="small"
          icon={<PlusOutlined/>}
          disabled={!access.canWrite}
          onClick={() => setEditor({open: true, identity: undefined, copy: false})}
        >
          新建
        </Button>,
      );
    }
    if (meta.exportable) {
      toolbarActions.push(
        <Button
          size="small"
          icon={<ExportOutlined/>}
          onClick={() => {
            const exportParams: { params: any[] } & any = {
              params: [],
              pageSize: 100,
              page: 1,
            }
            if (selectedRows.length > 0) {
              exportParams.params.push({
                key: 'id',
                value: selectedRows.map((item: any) => item[meta.rowKey]),
                operator: 'in',
              })
            }
            for (const key in params) {
              if (Array.isArray(params[key]) && params[key].length == 0) {
                continue
              }
              exportParams.params.push({
                key: key,
                operator: Array.isArray(params[key]) ? (key.endsWith('d_at') ? 'between' : 'in') : '=',
                value: params[key],
              })
            }


            setLoading(true);
            exportResources(resourceName, {
              ...exportParams,
            })
              .then(({url}) => {
                setDownloadUrl(url)
              })
              .finally(() => setLoading(false));
          }}
        >
          导出
        </Button>,
      );
    }

    if (sortKey) {
      toolbarActions.push(
        <Button size="small" icon={<SwapOutlined/>} disabled={!access.canWrite} onClick={() => {
          if (!access.canWrite) {
            message.warning('当前角色不可执行排序');
            return;
          }
          setSorting(!sorting)
        }}>
          {sorting ? '退出排序' : '排序'}
        </Button>,
      );
    }

    const handleDragSortEnd = async (
      beforeIndex: number,
      afterIndex: number,
      newDataSource: any,
    ) => {
      if (!access.canWrite) {
        message.warning('当前角色不可执行排序保存');
        return;
      }
      await new Promise<void>((resolve) => {
        Modal.confirm({
          title: '确认保存新的排序？',
          onOk: async () => {
            setLoading(true);
            for (let i = 0; i < newDataSource.length; i++) {
              await updateResource(resourceName, {
                [meta.rowKey]: newDataSource[i][meta.rowKey],
                sort: (params.page - 1) * params.per_page + newDataSource.length - i,
              });
            }
            ref.current?.reload();
            resolve();
          },
          onCancel: () => resolve(),
        });
      });
    };

    const actionFormRef = useRef<ProFormInstance>(null)

    const tableAlertOptionRender = useCallback(
      ({
         selectedRowKeys,
         selectedRows,
       }: {
        selectedRowKeys: React.Key[];
        selectedRows: any[];
      }) => {
        return (
          <div className="gap-2 flex">
            {actions
              .map(actionMapper)
              .filter((action) => action.multiple)
              .map((action, index) => {
                return (
                  <Button
                    size="small"
                    type="link"
                    key={index}
                    icon={action.icon}
                    disabled={
                      (action.disabled instanceof Function
                        ? action.disabled(selectedRowKeys as (string | number)[], selectedRows)
                        : action.disabled) || !access.canWrite
                    }
                    onClick={() => {
                      if (!access.canWrite) {
                        message.warning('当前角色不可执行写操作');
                        return;
                      }
                      if (action.onClick) {
                        action.onClick(selectedRowKeys as (string | number)[], selectedRows, {
                          editorHandler,
                          action: ref,
                          resourceName,
                        });
                      }
                      if (ref.current?.clearSelected) {
                        ref.current?.clearSelected();
                      }
                    }}
                  >
                    {action.title || action.text || action.name}
                  </Button>
                );
              })}
          </div>
        );
      },
      [],
    );

    const foreignKeyMapper = useCallback(function (col: any) {
      if (foreignKeys != undefined && foreignFields && col.foreignKey && foreignFields[col.dataIndex]) {
        col.valueEnum = foreignFields[col.dataIndex];
        col.valueType = 'select'
      }
      return col
    }, [foreignFields, foreignKeys])

    const editingMapper = (col: any) => ({
      ...col,
      editing: (editor.open && (!editor.copy && editor.identity != undefined))
    })

    const columns = meta.columns.map(editingMapper)
      .map(defaultColumnMapper)
      .map(foreignKeyMapper)
      .map(columnMapper)
      .map((column: any) => {
        const fieldName = getFieldName(column?.dataIndex);
        const endsWithHtml = fieldName.toLowerCase().endsWith('html');
        const endsWithUrl = fieldName.toLowerCase().endsWith('url');
        // if ((endsWithHtml || endsWithUrl) && typeof column?.render !== 'function') {
        //   column.render = (_: any, record: any, idx: number) => {
        //     const rawVal = getObjectValByPath(record, column?.dataIndex);
        //     return commonRender(fieldName, rawVal, {
        //       mode: 'table',
        //       column,
        //       label: String(column?.title ?? column?.dataIndex ?? idx),
        //       normalizeUrl,
        //       getExt,
        //       isImageExt,
        //       isVideoExt,
        //       isAudioExt,
        //       is3DExt,
        //       ensureModelViewerLoaded,
        //     });
        //   };
        // }
        return column;
      })
      .concat(sorting ? [] : operationColumns);

    const dragHandleRender = (rowData: any) => (
      <>
        <MenuOutlined style={{cursor: 'grab', color: 'gold'}}/>
        {sortKey && rowData[sortKey]}
      </>
    );

    return (
      <div>
        {meta.columns.length > 0 && editor.open && (
          <ResourceEditor
            {...editor}
            defaultValues={defaultValues}
            columnEditorMapper={columnEditorMapper}
            resourceName={resourceName}
            rowKey={meta.rowKey}
            columns={meta.columns.map(editingMapper).map(columnMapper)}
            expect={expect}
            {...editorProps}
            onOpenChange={(open) => {
              setEditor(
                produce((draft: any) => {
                  draft.open = open;

                  if (!open) {
                    ref.current?.reload();
                  }
                }),
              );
            }}
          />
        )}

        <Modal
          centered
          title={fileName ? `导出成功：${fileName}` : '导出成功'}
          okButtonProps={{hidden: true}}
          onCancel={() => setDownloadUrl(undefined)}
          open={downloadUrl !== undefined}
          footer={[
            <Button key="copy" onClick={copyDownloadUrl}>复制链接</Button>,
            <Button key="download" type="primary" onClick={triggerDownload}>重新下载</Button>,
            <Button key="close" onClick={() => setDownloadUrl(undefined)}>关闭</Button>,
          ]}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div>表格已生成，可直接下载或复制下载链接。</div>
            {downloadUrl && (
              <a
                className="text-[#1890FF] break-all"
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {downloadUrl}
              </a>
            )}
          </div>
        </Modal>

        {/* 动作参数确认表单 */}
        {actionForm.open && actionForm.action && (
          <ProValueTypeProvider id={actionForm?.id}>
            <Modal
              width='80%'
              open={actionForm.open}
              title={actionForm.action?.title || actionForm.action?.name}
              footer={actionForm?.id ? (
                <div>即将操作 ID
                  为 {typeof actionForm?.id === 'number' ? `${actionForm?.id}` : `[${actionForm?.id.join(',')}]`} 的数据</div>
              ) : undefined}
              centered={true}
              onCancel={() => setActionForm({open: false, action: undefined})}
            >
              {actionExtraRender && actionExtraRender(actionForm.action.name, actionFormRef)}
              <BetaSchemaForm
                formRef={actionFormRef}
                columns={resolveColumns(actionForm.action?.columns || [])}
                layoutType={'Form'}
                onFinish={async (values: any) => {
                  if (!access.canWrite) {
                    message.warning('当前角色不可执行该动作');
                    return false;
                  }
                  const confirmed = await new Promise<boolean>((resolve) => {
                    Modal.confirm({
                      title: `确认执行${actionForm.action?.title || actionForm.action?.name}？`,
                      onOk: () => resolve(true),
                      onCancel: () => resolve(false),
                    });
                  });
                  if (!confirmed) return false;
                  try {
                    const result = await actionResource(resourceName, actionForm.action.name, actionForm?.id, values);
                    if (result.code == 0) {
                      message.success(`${actionForm.action?.title || actionForm.action?.name}已触发`);
                      ref.current?.reload();
                    } else {
                      throw new Error(result.message);
                    }
                  } catch (e: any) {
                    message.error(e?.message || `${actionForm.action?.title || actionForm.action?.name}执行失败`);
                    return false;
                  } finally {
                    if (actionForm.action.batch) {
                      setSelectedRowKeys([]);
                      setSelectedRows([]);
                      if (ref.current?.clearSelected) {
                        ref.current?.clearSelected();
                      }
                    }
                    setActionForm({open: false, action: undefined});
                  }
                  return true;
                }}
                submitter={{searchConfig: {submitText: '确认执行'}, submitButtonProps: {disabled: !access.canWrite}}}
              >
              </BetaSchemaForm>
            </Modal>

          </ProValueTypeProvider>
        )}

        <Modal
          centered
          title={'详情'}
          open={detail.open}
          width={720}
          footer={null}
          onCancel={() => setDetail({open: false, identity: undefined, loading: false, data: null})}
        >
          {detail.loading ? (
            <div style={{padding: 16, textAlign: 'center'}}>
              <Spin/>
            </div>
          ) : detail.data ? (
            <Tabs
              defaultActiveKey="2"
              items={[
                {
                  key: '1',
                  label: '表单视图',
                  children: (
                    <ProValueTypeProvider>
                      <BetaSchemaForm
                        columns={resolveColumns(columns)}
                        disabled={true}
                        initialValues={detail.data}
                        submitter={false}
                      />
                    </ProValueTypeProvider>
                  ),
                },
                {
                  key: '2',
                  label: '详细信息',
                  children: (
                    <Descriptions column={1} size="small" bordered>
                      {meta.columns
                        .map(defaultColumnMapper)
                        .map(columnMapper)
                        .map((column: any, idx: number) => {
                          const label = String(column?.title ?? column?.dataIndex ?? idx);
                          const rawVal = getObjectValByPath(detail.data, column?.dataIndex);
                          const fieldName = getFieldName(column?.dataIndex);
                          const content = commonRender(fieldName, rawVal, {
                            mode: 'detail',
                            column,
                            label,
                            normalizeUrl,
                            getExt,
                            isImageExt,
                            isVideoExt,
                            isAudioExt,
                            is3DExt,
                            ensureModelViewerLoaded,
                            instantDownload,
                          });
                          return (
                            <Descriptions.Item key={String(column?.dataIndex ?? idx)} label={label}>
                              {content}
                            </Descriptions.Item>
                          );
                        })}
                    </Descriptions>
                  ),
                },
              ]}
            />
          ) : (
            <div style={{padding: 16}}>暂无数据</div>
          )}
        </Modal>

        {foreignKeys != undefined && (
          <ProValueTypeProvider>
            <ProTable
              searchFormRender={(props, defaultDom) => {
                return (
                  <CustomSearchForm
                    columns={meta.columns || []}
                    onSearch={(values) => {
                      setParams(values);
                    }}
                    onReset={() => {
                      // 重置搜索参数
                      setParams({});
                      // 重新加载表格
                      ref.current?.reload();
                    }}
                  />
                );
              }}
              {...proTableProps}
              loading={loading || foreignKeys === undefined}
              onLoadingChange={(v) => setLoading(v as boolean)}
              defaultSize="small"
              toolbar={{actions: toolbarActions}}
              actionRef={ref}
              formRef={formRef}
              tableAlertOptionRender={tableAlertOptionRender}
              rowKey={meta.rowKey}
              columns={columns}
              params={{...defaultParams, ...params}}
              ghost={ghost}
              request={handlerListResourceServiceCall(resourceName, sort, setParams, columns, async (data: any) => {
                for (const key in foreignKeys) {
                  const localKeys = data.map((row: any) => String(row[key]))
                  const fields = await batchFieldsResource(foreignKeys[key].model, foreignKeys[key].keyField, localKeys, foreignKeys[key].labelField)
                  setForeignFields({
                    [key]: {
                      ...fields
                    }
                  })
                }
              })}
              rowSelection={
                (select || (Array.isArray(meta.actions) && meta.actions.some((a: any) => a?.batch)))
                  ? {
                    selectedRowKeys,
                    onChange: (keys, rows) => {
                      setSelectedRowKeys(keys as React.Key[]);
                      setSelectedRows(rows as any[]);
                    },
                    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
                  }
                  : false
              }
              {...meta.tableOptions}
            />
          </ProValueTypeProvider>
        )}
      </div>
    );
  },
);

export default ResourceList;
