import React from 'react';
import ResourceList from "@/components/ResourceList";

export default () => <ResourceList
  columnMapper={(column) => {
    if (column.dataIndex === 'url') {
      column.render = (text, row, index, action) => {
        return  <a href={row.url} target="_blank" rel="noopener noreferrer">{text}</a>;
      }
    }

    return column;
  }}
  resourceName='exports'/>;
