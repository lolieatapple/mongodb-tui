import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';

const DocumentViewer = ({ collection, onBack }) => {
  const { stdout } = useStdout();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState('_id');
  const [sortDirection, setSortDirection] = useState(1); // 1 for ascending, -1 for descending
  const [searchMode, setSearchMode] = useState(false);
  const [searchField, setSearchField] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDocId, setEditDocId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [fields, setFields] = useState([]);
  const [columnOffset, setColumnOffset] = useState(0); // 添加列偏移量状态
  // 添加详情视图状态
  const [detailMode, setDetailMode] = useState(false);
  const [detailField, setDetailField] = useState('');
  const [detailValue, setDetailValue] = useState('');
  
  // 根据终端宽度计算可见列数和列宽
  const terminalWidth = stdout.columns || 80;
  const minColumnWidth = 15; // 最小列宽
  const maxColumnWidth = 40; // 最大列宽
  const padding = 2; // 列间距
  const reservedWidth = 10; // 为其他UI元素预留的宽度
  
  // 计算每列的宽度和可见列数
  const calculateColumnSettings = () => {
    const availableWidth = terminalWidth - reservedWidth;
    
    // 根据可用宽度计算合适的列宽
    let columnWidth = Math.min(maxColumnWidth, Math.max(minColumnWidth, Math.floor(availableWidth / 5)));
    
    // 计算可以显示的列数
    const visibleColumns = Math.max(1, Math.floor(availableWidth / (columnWidth + padding)));
    
    return { columnWidth, visibleColumns };
  };
  
  const { columnWidth, visibleColumns } = calculateColumnSettings();

  // Load documents with pagination, sorting, and optional filtering
  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Build query
      let query = {};
      if (searchField && searchValue) {
        try {
          // Try to parse the search value as a number or boolean if appropriate
          let parsedValue = searchValue;
          if (searchValue.toLowerCase() === 'true') parsedValue = true;
          else if (searchValue.toLowerCase() === 'false') parsedValue = false;
          else if (!isNaN(Number(searchValue))) parsedValue = Number(searchValue);
          
          query[searchField] = parsedValue;
        } catch (e) {
          query[searchField] = searchValue;
        }
      }
      
      // Get total count for pagination
      const total = await collection.countDocuments(query);
      setTotalCount(total);
      
      // Get documents for current page
      const sort = {};
      sort[sortField] = sortDirection;
      
      const docs = await collection.find(query)
        .sort(sort)
        .skip(page * pageSize)
        .limit(pageSize)
        .toArray();
      
      setDocuments(docs);
      
      // Extract all field names from the first few documents
      if (docs.length > 0) {
        const allFields = new Set();
        docs.forEach(doc => {
          Object.keys(doc).forEach(key => allFields.add(key));
        });
        setFields(Array.from(allFields));
      }
      
      // 确保selectedRow不超出当前页面的文档数量
      if (docs.length > 0 && selectedRow >= docs.length) {
        setSelectedRow(docs.length - 1);
      }
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [collection, page, sortField, sortDirection, searchField, searchValue]);

  // 当页面变化时，重置selectedRow为0
  useEffect(() => {
    setSelectedRow(0);
  }, [page]);

  // 当字段列表变化时，确保selectedCol在有效范围内
  useEffect(() => {
    if (fields.length > 0 && selectedCol >= fields.length) {
      setSelectedCol(Math.min(selectedCol, fields.length - 1));
    }
  }, [fields, selectedCol]);

  // 监听终端大小变化
  useEffect(() => {
    // 当终端大小变化时，确保columnOffset和selectedCol在有效范围内
    if (fields.length > 0) {
      const maxOffset = Math.max(0, fields.length - visibleColumns);
      if (columnOffset > maxOffset) {
        setColumnOffset(maxOffset);
      }
      
      if (selectedCol >= visibleColumns) {
        setSelectedCol(visibleColumns - 1);
      }
    }
  }, [stdout.columns, visibleColumns]);

  // 获取当前选中的字段名
  const getCurrentFieldName = () => {
    if (fields.length === 0) return '_id';
    const actualColIndex = columnOffset + selectedCol;
    return actualColIndex < fields.length ? fields[actualColIndex] : '_id';
  };

  // 获取当前选中的字段值
  const getCurrentFieldValue = () => {
    if (documents.length === 0 || selectedRow >= documents.length) return '';
    const fieldName = getCurrentFieldName();
    return documents[selectedRow][fieldName];
  };

  // 打开字段详情视图
  const openDetailView = () => {
    if (documents.length === 0) return;
    
    const fieldName = getCurrentFieldName();
    const fieldValue = getCurrentFieldValue();
    
    setDetailMode(true);
    setDetailField(fieldName);
    setDetailValue(fieldValue);
  };

  // Handle keyboard input
  useInput((input, key) => {
    if (key.escape) {
      // ESC key handling for all modes
      if (searchMode) {
        setSearchMode(false);
      } else if (editMode) {
        setEditMode(false);
        setEditField('');
        setEditValue('');
        setEditDocId(null);
      } else if (detailMode) {
        // 退出详情视图
        setDetailMode(false);
        setDetailField('');
        setDetailValue('');
      } else {
        onBack();
      }
      return;
    }
    
    // 如果在详情视图模式，只处理ESC键
    if (detailMode) return;
    
    // If in special modes, don't process other keys
    if (searchMode || editMode) return;
    
    // 如果没有文档，禁用导航键
    if (documents.length === 0) {
      if (key.pageDown && (page + 1) * pageSize < totalCount) {
        setPage(p => p + 1);
      } else if (key.pageUp && page > 0) {
        setPage(p => p - 1);
      } else if (input === 'f') {
        setPage(0);
      } else if (input === 'l') {
        setPage(Math.floor(totalCount / pageSize));
      }
      return;
    }
    
    if (key.return) {
      // 回车键打开详情视图
      openDetailView();
    } else if (key.pageDown && (page + 1) * pageSize < totalCount) {
      // Page Down key for next page
      setPage(p => p + 1);
    } else if (key.pageUp && page > 0) {
      // Page Up key for previous page
      setPage(p => p - 1);
    } else if (key.upArrow && selectedRow > 0) {
      // Up arrow to move selection up
      setSelectedRow(r => r - 1);
    } else if (key.downArrow && selectedRow < documents.length - 1) {
      // Down arrow to move selection down
      setSelectedRow(r => r + 1);
    } else if (key.leftArrow) {
      if (selectedCol > 0) {
        // 左箭头在当前可见列中移动
        setSelectedCol(c => c - 1);
      } else if (columnOffset > 0) {
        // 如果已经在最左边的可见列，且有更多列在左侧，则滚动列
        setColumnOffset(offset => offset - 1);
      }
    } else if (key.rightArrow) {
      if (selectedCol < visibleColumns - 1 && selectedCol < fields.length - 1 - columnOffset) {
        // 右箭头在当前可见列中移动
        setSelectedCol(c => c + 1);
      } else if (columnOffset + visibleColumns < fields.length) {
        // 如果已经在最右边的可见列，且有更多列在右侧，则滚动列
        setColumnOffset(offset => offset + 1);
        if (selectedCol === visibleColumns - 1) {
          // 如果选择在最右边的可见列，保持选择在最右边
          setSelectedCol(visibleColumns - 1);
        }
      }
    } else if (input === 's') {
      // Enter search mode with current field pre-selected
      setSearchMode(true);
      setSearchField(getCurrentFieldName());
      setSearchValue('');
    } else if (input === 'o') {
      // Toggle sort direction on current field
      const currentField = getCurrentFieldName();
      if (sortField === currentField) {
        // 如果当前已经按这个字段排序，则切换排序方向
        setSortDirection(d => d * -1);
      } else {
        // 否则，切换到按这个字段排序，默认升序
        setSortField(currentField);
        setSortDirection(1);
      }
    } else if (input === 'e' && documents.length > 0) {
      // Enter edit mode for the selected field of the selected document
      if (fields.length > 0) {
        const actualFieldIndex = columnOffset + selectedCol;
        if (actualFieldIndex < fields.length) {
          setEditMode(true);
          setEditField(fields[actualFieldIndex]);
          setEditDocId(documents[selectedRow]._id);
          setEditValue(documents[selectedRow][fields[actualFieldIndex]]?.toString() || '');
        }
      }
    } else if (input === 'f') {
      // Go to first page
      setPage(0);
    } else if (input === 'l') {
      // Go to last page
      setPage(Math.floor(totalCount / pageSize));
    } else if (input === '[') {
      // 滚动到最左边的列
      setColumnOffset(0);
      setSelectedCol(0);
    } else if (input === ']') {
      // 滚动到最右边的列
      const maxOffset = Math.max(0, fields.length - visibleColumns);
      setColumnOffset(maxOffset);
      setSelectedCol(Math.min(visibleColumns - 1, fields.length - 1 - maxOffset));
    }
  });

  const handleSearchSubmit = () => {
    setSearchMode(false);
    // The search will be applied via the useEffect
  };

  const handleEditFieldSubmit = () => {
    if (editField) {
      setEditValue(documents[selectedRow][editField]?.toString() || '');
    }
  };

  const handleEditValueSubmit = async () => {
    try {
      setLoading(true);
      
      // Try to parse the edit value appropriately
      let parsedValue = editValue;
      if (editValue.toLowerCase() === 'true') parsedValue = true;
      else if (editValue.toLowerCase() === 'false') parsedValue = false;
      else if (!isNaN(Number(editValue))) parsedValue = Number(editValue);
      
      // Update the document
      const updateDoc = {};
      updateDoc[editField] = parsedValue;
      
      await collection.updateOne(
        { _id: editDocId },
        { $set: updateDoc }
      );
      
      setEditMode(false);
      setEditField('');
      setEditValue('');
      setEditDocId(null);
      
      // Reload documents to show the update
      await loadDocuments();
    } catch (err) {
      setError(`Failed to update document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 渲染字段详情视图
  const renderDetailView = () => {
    // 将值格式化为字符串
    let formattedValue = '';
    if (detailValue === null || detailValue === undefined) {
      formattedValue = 'null';
    } else if (typeof detailValue === 'object') {
      try {
        formattedValue = JSON.stringify(detailValue, null, 2);
      } catch (e) {
        formattedValue = String(detailValue);
      }
    } else {
      formattedValue = String(detailValue);
    }

    return (
      <Box flexDirection="column" width={terminalWidth}>
        <Box marginBottom={1}>
          <Text bold>Field Detail View</Text>
        </Box>
        <Box marginBottom={1}>
          <Text bold>Document ID: </Text>
          <Text>{documents[selectedRow]._id?.toString() || 'Unknown'}</Text>
        </Box>
        <Box marginBottom={1}>
          <Text bold>Field Name: </Text>
          <Text>{detailField}</Text>
        </Box>
        <Box marginBottom={1}>
          <Text bold>Field Type: </Text>
          <Text>{typeof detailValue === 'object' ? (detailValue === null ? 'null' : Array.isArray(detailValue) ? 'array' : 'object') : typeof detailValue}</Text>
        </Box>
        <Box flexDirection="column" marginY={1}>
          <Text bold>Field Value:</Text>
          <Box flexDirection="column" marginLeft={2} marginTop={1}>
            {formattedValue.split('\n').map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </Box>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press ESC to go back</Text>
        </Box>
      </Box>
    );
  };

  // Render search input
  if (searchMode) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text>Searching field: <Text bold>{searchField}</Text></Text>
        </Box>
        <Box>
          <Text>Enter search value:</Text>
          <TextInput 
            value={searchValue} 
            onChange={setSearchValue} 
            onSubmit={() => handleSearchSubmit()} 
          />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press ESC to cancel search</Text>
        </Box>
      </Box>
    );
  }

  // Render edit input
  if (editMode) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text>Editing field: <Text bold>{editField}</Text></Text>
        </Box>
        <Box>
          <Text>Enter new value:</Text>
          <TextInput 
            value={editValue} 
            onChange={setEditValue} 
            onSubmit={handleEditValueSubmit} 
          />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press ESC to cancel editing</Text>
        </Box>
      </Box>
    );
  }

  // 显示详情视图
  if (detailMode) {
    return renderDetailView();
  }

  if (loading) {
    return (
      <Box>
        <Text>
          <Spinner type="dots" />
          {' Loading documents...'}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
        <Text>Press ESC to go back</Text>
      </Box>
    );
  }

  if (documents.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>No documents found in this collection.</Text>
        <Text>Press ESC to go back</Text>
      </Box>
    );
  }

  // 计算当前可见的字段
  const visibleFields = fields.slice(columnOffset, columnOffset + visibleColumns);
  const hasMoreLeft = columnOffset > 0;
  const hasMoreRight = columnOffset + visibleColumns < fields.length;

  // Render document table
  return (
    <Box flexDirection="column" width={terminalWidth}>
      <Box marginBottom={1}>
        <Text bold>Collection Documents</Text>
        <Text> (Total: {totalCount} documents | Page {page + 1} of {Math.ceil(totalCount / pageSize)} | Terminal width: {terminalWidth}px)</Text>
      </Box>
      
      {/* 列导航指示器 */}
      <Box marginBottom={1}>
        <Text>
          Fields {columnOffset + 1}-{Math.min(columnOffset + visibleColumns, fields.length)} of {fields.length}
          {hasMoreLeft && ' « more fields'}
          {hasMoreRight && ' more fields »'}
        </Text>
      </Box>
      
      {/* Table header */}
      <Box>
        {visibleFields.map((field, index) => (
          <Box key={index} width={columnWidth} marginRight={1}>
            <Text 
              bold 
              underline={field === sortField}
              backgroundColor={index === selectedCol ? 'cyan' : undefined}
              color={index === selectedCol ? 'black' : undefined}
            >
              {field} {field === sortField ? (sortDirection === 1 ? '↑' : '↓') : ''}
            </Text>
          </Box>
        ))}
      </Box>
      
      {/* Table rows */}
      {documents.map((doc, rowIndex) => (
        <Box key={rowIndex} backgroundColor={rowIndex === selectedRow ? 'blue' : undefined}>
          {visibleFields.map((field, colIndex) => (
            <Box key={colIndex} width={columnWidth} marginRight={1}>
              <Text 
                color={rowIndex === selectedRow ? 'white' : undefined}
                backgroundColor={rowIndex === selectedRow && colIndex === selectedCol ? 'cyan' : undefined}
                bold={rowIndex === selectedRow && colIndex === selectedCol}
              >
                {formatValue(doc[field], columnWidth)}
              </Text>
            </Box>
          ))}
        </Box>
      ))}
      
      {/* Controls */}
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>
          PgUp/PgDn: Navigate pages | ↑↓←→: Select field | e: Edit selected field | o: Toggle sort
        </Text>
        <Text dimColor>
          f: First page | l: Last page | s: Search | [: First columns | ]: Last columns | Enter: View details | ESC: Back
        </Text>
        {searchField && searchValue && (
          <Text>
            Filtering by: {searchField} = {searchValue}
          </Text>
        )}
      </Box>
    </Box>
  );
};

// Helper function to format values for display
const formatValue = (value, maxWidth = 20) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    if (value instanceof Date) return value.toISOString();
    const stringified = JSON.stringify(value);
    return stringified.substring(0, maxWidth - 3) + (stringified.length > maxWidth - 3 ? '...' : '');
  }
  const stringValue = String(value);
  return stringValue.substring(0, maxWidth - 3) + (stringValue.length > maxWidth - 3 ? '...' : '');
};

export default DocumentViewer;
