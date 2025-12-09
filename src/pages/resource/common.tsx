import React from 'react';
import { useParams } from '@umijs/max';
import ResourceList from "@/components/ResourceList";
export default () => {
  const params = useParams();
  const resourceName = typeof params?.name === 'string' ? params.name : '';
  return <ResourceList resourceName={resourceName}/>;
};
