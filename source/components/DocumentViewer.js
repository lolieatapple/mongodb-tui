import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import { ObjectId } from 'mongodb';

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
  // 添加删除确认状态
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState(null);
  
  // 根据终端宽度计算可见列数和列宽
  const terminalWidth = stdout.columns || 80;
  const minColumnWidth = 15; // 最小列宽
  const maxColumnWidth = 30; // 减小最大列宽以适应边框
  const padding = 2; // 列间距
  // 调整预留宽度，考虑边框和内边距的影响
  const borderAndPaddingWidth = 6; // 边框和内边距占用的宽度 (左右各2个字符的边框 + 左右各1个字符的内边距)
  const otherUIWidth = 16; // 其他UI元素占用的宽度
  const reservedWidth = borderAndPaddingWidth + otherUIWidth; // 总预留宽度
  
  // 计算每列的宽度和可见列数
  const calculateColumnSettings = () => {
    // 考虑边框和内边距后的可用宽度
    const availableWidth = terminalWidth - reservedWidth;
    
    // 根据可用宽度计算合适的列宽
    let columnWidth = Math.min(maxColumnWidth, Math.max(minColumnWidth, Math.floor(availableWidth / 3)));
    
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
      // 保存原始页码，用于在没有搜索时恢复
      const originalPage = page;
      
      if (searchValue) {
        try {
          // Try to parse the search value as a number or boolean if appropriate
          let parsedValue = searchValue;
          if (searchValue.toLowerCase() === 'true') parsedValue = true;
          else if (searchValue.toLowerCase() === 'false') parsedValue = false;
          else if (!isNaN(Number(searchValue))) parsedValue = Number(searchValue);
          
          // Create a regex for fuzzy matching with case insensitivity
          const regexValue = new RegExp(searchValue, 'i');
          
          // If searchField is specified, search only in that field
          if (searchField && searchField !== '_all') {
            // 特殊处理 _id 字段，尝试使用 ObjectId
            if (searchField === '_id') {
              try {
                // 尝试完全匹配 ObjectId
                if (searchValue.length === 24 && /^[0-9a-fA-F]{24}$/.test(searchValue)) {
                  query._id = new ObjectId(searchValue);
                } else {
                  // 如果不是完整的 ObjectId 格式，使用正则表达式进行模糊匹配
                  // MongoDB 的 _id 在字符串表示中是 24 位十六进制字符
                  // 我们尝试匹配用户输入的部分内容
                  query._id = { $regex: searchValue, $options: 'i' };
                }
              } catch (error) {
                // 如果转换 ObjectId 失败，回退到正则匹配
                query._id = { $regex: searchValue, $options: 'i' };
              }
            } else {
              // 对于其他字段，使用之前的逻辑
              // Use regex for string values to enable fuzzy matching
              if (typeof parsedValue === 'string') {
                query[searchField] = regexValue;
              } else {
                // For non-string values, use exact match
                query[searchField] = parsedValue;
              }
            }
          } else {
            // Global search across all fields
            // Create an $or query to search across all fields
            const allFields = fields.length > 0 ? fields : ['_id'];
            query.$or = allFields.map(field => {
              // 特殊处理 _id 字段
              if (field === '_id') {
                try {
                  // 尝试完全匹配 ObjectId
                  if (searchValue.length === 24 && /^[0-9a-fA-F]{24}$/.test(searchValue)) {
                    return { _id: new ObjectId(searchValue) };
                  } else {
                    // 如果不是完整的 ObjectId 格式，使用正则表达式进行模糊匹配
                    return { _id: { $regex: searchValue, $options: 'i' } };
                  }
                } catch (error) {
                  // 如果转换 ObjectId 失败，回退到正则匹配
                  return { _id: { $regex: searchValue, $options: 'i' } };
                }
              }
              // 对于其他字段，使用之前的逻辑
              return { [field]: typeof parsedValue === 'string' ? regexValue : parsedValue };
            });
          }
        } catch (e) {
          // Fallback to simple string search if there's an error
          if (searchField && searchField !== '_all') {
            if (searchField === '_id') {
              try {
                // 尝试完全匹配 ObjectId
                if (searchValue.length === 24 && /^[0-9a-fA-F]{24}$/.test(searchValue)) {
                  query._id = new ObjectId(searchValue);
                } else {
                  // 如果不是完整的 ObjectId 格式，使用正则表达式进行模糊匹配
                  query._id = { $regex: searchValue, $options: 'i' };
                }
              } catch (error) {
                // 如果转换 ObjectId 失败，回退到正则匹配
                query._id = { $regex: searchValue, $options: 'i' };
              }
            } else {
              query[searchField] = new RegExp(searchValue, 'i');
            }
          } else {
            // Global search with fallback
            const allFields = fields.length > 0 ? fields : ['_id'];
            query.$or = allFields.map(field => {
              if (field === '_id') {
                try {
                  // 尝试完全匹配 ObjectId
                  if (searchValue.length === 24 && /^[0-9a-fA-F]{24}$/.test(searchValue)) {
                    return { _id: new ObjectId(searchValue) };
                  } else {
                    // 如果不是完整的 ObjectId 格式，使用正则表达式进行模糊匹配
                    return { _id: { $regex: searchValue, $options: 'i' } };
                  }
                } catch (error) {
                  // 如果转换 ObjectId 失败，回退到正则匹配
                  return { _id: { $regex: searchValue, $options: 'i' } };
                }
              }
              return { [field]: new RegExp(searchValue, 'i') };
            });
          }
        }
      }
      
      // Get total count for pagination
      const total = await collection.countDocuments(query);
      setTotalCount(total);
      
      // 修复：只有在初次搜索时才重置页码，而不是每次加载文档时都重置
      let currentPage = page;
      if (searchMode && searchValue) {
        // 只有在搜索模式下且刚提交搜索时才重置页码
        currentPage = 0;
        if (page !== 0) {
          setPage(0);
        }
      }
      
      // Get documents for current page
      const sort = {};
      sort[sortField] = sortDirection;
      
      const docs = await collection.find(query)
        .sort(sort)
        .skip(currentPage * pageSize)
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
  }, [collection, page, sortField, sortDirection]);  // 移除 searchField 和 searchValue 依赖
  
  // 添加单独的 useEffect 来处理搜索条件变化
  useEffect(() => {
    if (searchField && searchValue) {
      loadDocuments();
    }
  }, [searchField, searchValue]);

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

  // 打开删除确认对话框
  const openDeleteConfirmation = () => {
    if (documents.length === 0) return;
    
    setDeleteMode(true);
    setDeleteDocId(documents[selectedRow]._id);
  };

  // 执行删除文档操作
  const handleDeleteDocument = async () => {
    try {
      setLoading(true);
      
      await collection.deleteOne({ _id: deleteDocId });
      
      setDeleteMode(false);
      setDeleteDocId(null);
      
      // 重新加载文档列表
      await loadDocuments();
    } catch (err) {
      setError(`Failed to delete document: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
      } else if (deleteMode) {
        // 退出删除确认
        setDeleteMode(false);
        setDeleteDocId(null);
      } else {
        onBack();
      }
      return;
    }
    
    // 如果在删除确认模式，处理确认/取消操作
    if (deleteMode) {
      if (input === 'y') {
        handleDeleteDocument();
      } else if (input === 'n') {
        setDeleteMode(false);
        setDeleteDocId(null);
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
          setSelectedCol(c => c + 1);
        }
      }
    } else if (input === 's') {
      // 's' key to enter search mode for current field
      setSearchField(getCurrentFieldName());
      setSearchMode(true);
      return;
    } else if (input === 'g') {
      // 'g' key to enter global search mode (search across all fields)
      setSearchField('_all');
      setSearchMode(true);
      return;
    } else if (input === 'd') {
      // 'd' key to delete the current document
      openDeleteConfirmation();
      return;
    } else if (input === 'o') {
      // 'o' key to toggle sort direction or change sort field
      const currentField = getCurrentFieldName();
      if (currentField === sortField) {
        // 如果当前字段已经是排序字段，则切换排序方向
        setSortDirection(sortDirection === 1 ? -1 : 1);
      } else {
        // 如果选择了新字段，设置为新的排序字段并默认为升序
        setSortField(currentField);
        setSortDirection(1);
      }
      return;
    }
  });

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
    const isObject = typeof detailValue === 'object' && detailValue !== null;
    let formattedValue;
    
    // 处理对象和数组
    if (isObject) {
      try {
        // 使用自定义的格式化函数处理JSON对象，确保长字符串正确换行
        formattedValue = formatDetailJSON(detailValue);
      } catch (e) {
        formattedValue = String(detailValue);
      }
    } else {
      formattedValue = String(detailValue);
    }
    
    // 计算详情视图的内容宽度
    const contentWidth = terminalWidth - borderAndPaddingWidth - 8; // 减去边框、内边距和缩进
    
    return (
      <Box flexDirection="column" width={terminalWidth - 2} borderStyle="round" borderColor="cyan" padding={1}>
        <Box marginBottom={1}>
          <Text bold backgroundColor="cyan" color="black" padding={1}>
            Field Details
          </Text>
        </Box>
        
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color="yellow" bold>Document ID: </Text>
            <Text>{editDocId ? String(editDocId) : documents[selectedRow]?._id?.toString() || 'N/A'}</Text>
          </Box>
          <Box>
            <Text color="yellow" bold>Field Name: </Text>
            <Text color="green">{detailField}</Text>
          </Box>
          <Box>
            <Text color="yellow" bold>Field Type: </Text>
            <Text color="magenta">{isObject ? (Array.isArray(detailValue) ? 'Array' : 'Object') : typeof detailValue}</Text>
          </Box>
        </Box>
        
        <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1} marginBottom={1} width={terminalWidth - 10}>
          <Text color="cyan" bold>Value:</Text>
          <Box flexDirection="column" marginLeft={1} marginTop={1}>
            {formattedValue.split('\n').map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </Box>
        </Box>
        
        <Box>
          <Text color="gray">Press <Text color="cyan" bold>ESC</Text> to go back</Text>
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

  // 用于详情视图的JSON格式化函数，确保长字符串完整显示并正确换行
  const formatDetailJSON = (obj) => {
    try {
      // 先使用标准JSON.stringify进行格式化
      const formatted = JSON.stringify(obj, null, 2);
      
      // 处理长字符串
      const lines = formatted.split('\n');
      const processedLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 匹配包含长字符串的行
        const match = line.match(/^(\s*)(".*?"):\s*"(.+?)"(,?)$/);
        
        if (match && match[3].length > 80) {
          // 这是一个长字符串属性
          const [_, indent, key, value, comma] = match;
          
          // 添加字段名
          processedLines.push(`${indent}${key}: "`);
          
          // 将长字符串分成多行，每行最多80个字符
          for (let j = 0; j < value.length; j += 80) {
            const chunk = value.substring(j, j + 80);
            const isLastChunk = j + 80 >= value.length;
            
            if (isLastChunk) {
              // 最后一行，添加结束引号和可能的逗号
              processedLines.push(`${indent}  ${chunk}"${comma}`);
            } else {
              processedLines.push(`${indent}  ${chunk}`);
            }
          }
        } else {
          // 普通行，直接添加
          processedLines.push(line);
        }
      }
      
      return processedLines.join('\n');
    } catch (e) {
      // 如果自定义格式化失败，回退到标准格式化
      try {
        return JSON.stringify(obj, null, 2);
      } catch (err) {
        return String(obj);
      }
    }
  };

  // 搜索模式界面
  if (searchMode) {
    return (
      <Box flexDirection="column" width={terminalWidth - 2} borderStyle="round" borderColor="yellow" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="yellow">🔍 Search Documents</Text>
        </Box>
        <Box marginBottom={1}>
          <Text>Searching in field: <Text bold color="green">{searchField ? (searchField === '_all' ? 'All Fields (Global Search)' : searchField) : getCurrentFieldName()}</Text></Text>
        </Box>
        <Box marginBottom={1}>
          <Box marginRight={1}>
            <Text color="yellow" bold>Search Value:</Text>
          </Box>
          <TextInput 
            value={searchValue} 
            onChange={setSearchValue} 
            onSubmit={() => {
              // Set the search field - if not explicitly set, use the current field or global search
              if (!searchField) {
                const currentField = getCurrentFieldName();
                setSearchField(currentField);
              }
              setSearchMode(false);
              // 手动调用 loadDocuments 而不是依赖 useEffect
              loadDocuments();
            }}
          />
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Press <Text color="cyan" bold>ESC</Text> to cancel search</Text>
        </Box>
      </Box>
    );
  }

  // 编辑字段名称模式
  if (editMode && !editField) {
    return (
      <Box flexDirection="column" width={terminalWidth - 2} borderStyle="round" borderColor="magenta" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="magenta">✏️ Edit Field</Text>
        </Box>
        <Box marginBottom={1}>
          <Text>Editing document with ID: <Text bold color="green">{documents[selectedRow]._id?.toString()}</Text></Text>
        </Box>
        <Box marginBottom={1}>
          <Box marginRight={1}>
            <Text color="yellow" bold>Field Name:</Text>
          </Box>
          <TextInput 
            value={editField} 
            onChange={setEditField} 
            onSubmit={() => {
              setEditMode(true);
              setEditValue(String(documents[selectedRow][editField]));
              setEditDocId(documents[selectedRow]._id);
            }}
          />
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Press <Text color="cyan" bold>ESC</Text> to cancel editing</Text>
        </Box>
      </Box>
    );
  }

  // 编辑字段值模式
  if (editMode && editField) {
    return (
      <Box flexDirection="column" width={terminalWidth - 2} borderStyle="round" borderColor="magenta" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="magenta">✏️ Edit Value</Text>
        </Box>
        <Box marginBottom={1}>
          <Text>Editing field <Text bold color="green">{editField}</Text> in document with ID: <Text bold color="green">{documents[selectedRow]._id?.toString()}</Text></Text>
        </Box>
        <Box marginBottom={1}>
          <Box marginRight={1}>
            <Text color="yellow" bold>New Value:</Text>
          </Box>
          <TextInput 
            value={editValue} 
            onChange={setEditValue} 
            onSubmit={handleEditValueSubmit}
          />
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Press <Text color="cyan" bold>ESC</Text> to cancel editing</Text>
        </Box>
      </Box>
    );
  }

  // 显示详情视图
  if (detailMode) {
    return renderDetailView();
  }

  // 删除确认对话框
  if (deleteMode) {
    return (
      <Box flexDirection="column" width={terminalWidth - 2} borderStyle="round" borderColor="red" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="red">⚠️ Delete Document</Text>
        </Box>
        <Box marginBottom={1}>
          <Text>Are you sure you want to delete document with ID: <Text bold color="yellow">{deleteDocId?.toString()}</Text>?</Text>
        </Box>
        <Box marginBottom={1}>
          <Text>This action <Text color="red" bold>cannot be undone</Text>.</Text>
        </Box>
        <Box marginTop={1}>
          <Text>Press <Text color="green" bold>y</Text> to confirm or <Text color="red" bold>n</Text> to cancel</Text>
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box>
        <Text>
          <Text color="green"><Spinner type="dots" /></Text>
          <Text color="cyan"> Loading documents...</Text>
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="red" padding={1}>
        <Text color="red" bold>Error: {error}</Text>
        <Text color="gray">Press <Text color="cyan" bold>ESC</Text> to go back</Text>
      </Box>
    );
  }

  if (documents.length === 0) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="yellow" padding={1}>
        <Text color="yellow" bold>No documents found in this collection.</Text>
        <Text color="gray">Press <Text color="cyan" bold>ESC</Text> to go back</Text>
      </Box>
    );
  }

  // 计算当前可见的字段
  const visibleFields = fields.slice(columnOffset, columnOffset + visibleColumns);
  const hasMoreLeft = columnOffset > 0;
  const hasMoreRight = columnOffset + visibleColumns < fields.length;

  // Render document table
  return (
    <Box flexDirection="column" width={terminalWidth - 2} borderStyle="round" borderColor="blue" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">📄 Collection Documents</Text>
        <Text color="cyan"> (Total: <Text color="green" bold>{totalCount}</Text> documents | Page <Text color="green" bold>{page + 1}</Text> of <Text color="green" bold>{Math.ceil(totalCount / pageSize)}</Text>)</Text>
      </Box>
      
      {/* 列导航指示器 */}
      <Box marginBottom={1}>
        <Text color="magenta">
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
              color={index === selectedCol ? 'black' : 'yellow'}
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
      <Box marginTop={1} flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
        <Text color="gray">
          <Text color="cyan" bold>PgUp</Text>/<Text color="cyan" bold>PgDn</Text>: Navigate pages | 
          <Text color="cyan" bold>↑↓←→</Text>: Select field | 
          <Text color="green" bold>e</Text>: Edit selected field | 
          <Text color="green" bold>d</Text>: Delete document | 
          <Text color="green" bold>o</Text>: Toggle sort
        </Text>
        <Text color="gray">
          <Text color="green" bold>f</Text>: First page | 
          <Text color="green" bold>l</Text>: Last page | 
          <Text color="green" bold>s</Text>: Search Field | <Text color="green" bold>g</Text>: Global Search | 
          <Text color="green" bold>[</Text>: First columns | 
          <Text color="green" bold>]</Text>: Last columns | 
          <Text color="cyan" bold>Enter</Text>: View details | 
          <Text color="cyan" bold>ESC</Text>: Back
        </Text>
        {searchValue && (
          <Text>
            Filtering by: <Text color="yellow" bold>{searchField === '_all' ? 'All Fields' : searchField}</Text> {searchField === '_all' ? 'contains' : '='} <Text color="green" bold>{searchValue}</Text>
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default DocumentViewer;
