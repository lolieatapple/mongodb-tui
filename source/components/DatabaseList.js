import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';

const DatabaseList = ({ client, onSelectDatabase }) => {
  const [loading, setLoading] = useState(true);
  const [databases, setDatabases] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setLoading(true);
        const adminDb = client.db('admin');
        const result = await adminDb.admin().listDatabases();
        const items = result.databases.map(db => ({
          label: db.name,
          value: db.name
        }));
        setDatabases(items);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDatabases();
  }, [client]);

  if (loading) {
    return (
      <Box>
        <Text>
          <Spinner type="dots" />
          {' Loading databases...'}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error loading databases:</Text>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Select a Database</Text>
      </Box>
      <SelectInput 
        items={databases} 
        onSelect={item => onSelectDatabase(item.value)} 
      />
      <Box marginTop={1}>
        <Text dimColor>Use arrow keys to navigate, Enter to select</Text>
      </Box>
    </Box>
  );
};

export default DatabaseList;
