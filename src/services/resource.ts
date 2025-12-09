import {request} from '@umijs/max';


export async function getResourceMeta(model: string) {
  return request(`/api/admin/resource/meta`, {
    params: {model},
  });
}

export async function getResourceList(model: string, params: any) {
  const merged = {model, query: params};
  // const qs = toQueryString(merged);
  return request(`/api/admin/resource/list`, {
    method: 'POST',
    data: merged,
  });
}

export async function exportResources(model: string, params: any) {
  return request<{ data: { url: string } }>(`/api/admin/resource/export`, {
    method: 'POST',
    data: {model, query: {...(params || {})}},
  }).then((res) => res.data);
}

export async function deleteResource(model: string, id: any) {
  return request(`/api/admin/resource/delete`, {
    method: 'POST',
    data: {id, model},
  });
}

export async function createResource(model: string, data: any) {
  return request(`/api/admin/resource/create`, {
    method: 'POST',
    data: {model, fields: data},
  }).then(res => {
    if (res.code == 0) {
      return res.data
    }
    return {success: false, message: res.message}
  });
}

function wrapperResponse(res: any) {
  if (res.data) {
    return res.data
  }
  throw {success: false, ...res}
}

export async function updateResource(model: string, data: Record<string, any>) {
  const id = data['id']
  delete data['id']
  return request(`/api/admin/resource/update`, {
    method: 'POST',
    data: {
      id, model, fields: data
    },
  }).then(res => wrapperResponse(res));
}

export async function findResource(model: string, id: any) {
  return request(`/api/admin/resource/detail`, {
    params: {id, model},
  }).then(res => res.data.item);
}

export async function batchFieldsResource(model: string, keyField: string, keys: any, labelField: string) {
  return request(`/api/admin/resource/batch-fetch-fields`, {
    data: {model, keys, keyField, labelField},
    method: 'POST'
  }).then(res => res.data.fields);
}

export async function actionResource(
  model: string,
  trigger: string,
  id: any,
  params?: any,
) {
  return request(`/api/admin/resource/action`, {
    method: 'POST',
    data: {model, action: trigger, payload: JSON.stringify({id, ...params})},
  });
}
